const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all manufacturing records
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.execute(`
      SELECT m.*, i.name as item_name, i.sku 
      FROM manufacturing m 
      JOIN items i ON m.item_id = i.id 
      ORDER BY m.manufacturing_date DESC, m.manufacturing_time DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching manufacturing records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch manufacturing records' });
  }
});

// Get manufacturing record by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await req.db.execute(`
      SELECT m.*, i.name as item_name, i.sku 
      FROM manufacturing m 
      JOIN items i ON m.item_id = i.id 
      WHERE m.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Manufacturing record not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching manufacturing record:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch manufacturing record' });
  }
});

// Create new manufacturing record(s) - supports single or multiple items
router.post('/', [
  // Support both old format (single item) and new format (array of items)
  body('item_id').optional().isInt({ min: 1 }).withMessage('Valid item ID is required'),
  body('quantity_manufactured').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('items').optional().isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.item_id').if(body('items').exists()).isInt({ min: 1 }).withMessage('Each item must have a valid item ID'),
  body('items.*.quantity_manufactured').if(body('items').exists()).isInt({ min: 1 }).withMessage('Each item must have a valid quantity'),
  body('batch_number').optional({ checkFalsy: true }).isString().withMessage('Batch number must be text'),
  body('staff_name').notEmpty().trim().withMessage('Staff name is required'),
  body('manufacturing_date').isISO8601().withMessage('Valid manufacturing date is required'),
  body('manufacturing_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/).withMessage('Valid time format is required (HH:MM or HH:MM:SS)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ success: false, error: errorMessages, errors: errors.array() });
    }

    const { items, item_id, quantity_manufactured, batch_number, staff_name, manufacturing_date, manufacturing_time, notes } = req.body;
    
    // Normalize time to HH:MM:SS for MySQL TIME
    const normalizedTime = manufacturing_time.length === 5 ? `${manufacturing_time}:00` : manufacturing_time;
    
    // Support both old format (single item) and new format (array of items)
    let itemsToProcess = [];
    if (items && Array.isArray(items) && items.length > 0) {
      // New format: array of items - validate each item has required fields
      for (const item of items) {
        if (!item.item_id || !item.quantity_manufactured) {
          return res.status(400).json({ 
            success: false, 
            error: 'Each item in the array must have item_id and quantity_manufactured' 
          });
        }
        itemsToProcess.push({
          item_id: parseInt(item.item_id),
          quantity_manufactured: parseInt(item.quantity_manufactured)
        });
      }
    } else if (item_id && quantity_manufactured) {
      // Old format: single item (backward compatibility)
      itemsToProcess = [{ 
        item_id: parseInt(item_id), 
        quantity_manufactured: parseInt(quantity_manufactured) 
      }];
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Either items array or item_id with quantity_manufactured is required' 
      });
    }

    // Verify all items exist
    const itemIds = itemsToProcess.map(item => item.item_id);
    const [itemRows] = await req.db.execute(
      `SELECT id, name FROM items WHERE id IN (${itemIds.map(() => '?').join(',')})`,
      itemIds
    );
    
    if (itemRows.length !== itemIds.length) {
      const foundIds = itemRows.map(row => row.id);
      const missingIds = itemIds.filter(id => !foundIds.includes(id));
      return res.status(400).json({ success: false, error: `Items not found: ${missingIds.join(', ')}` });
    }

    const itemMap = {};
    itemRows.forEach(row => {
      itemMap[row.id] = row.name;
    });

    // Process all items in a single transaction
    const results = await req.db.withTransaction(async (tx) => {
      const createdRecords = [];
      const allShortages = [];

      // Process each item
      for (const itemData of itemsToProcess) {
        const { item_id: currentItemId, quantity_manufactured: currentQuantity } = itemData;

        // Fetch BOM for the item
        const [bomRows] = await tx.execute(
          `SELECT ib.raw_material_id, ib.quantity_per_unit, ib.unit, rm.current_stock, rm.name as raw_material_name
           FROM item_bom ib
           JOIN raw_materials rm ON rm.id = ib.raw_material_id
           WHERE ib.item_id = ?`,
          [currentItemId]
        );

        if (bomRows.length > 0) {
          // Calculate total required quantities
          const shortages = [];
          for (const row of bomRows) {
            const requiredQty = Number(row.quantity_per_unit) * Number(currentQuantity);
            if (Number(row.current_stock) < requiredQty) {
              shortages.push({
                item_name: itemMap[currentItemId],
                raw_material_id: row.raw_material_id,
                raw_material_name: row.raw_material_name,
                required: requiredQty,
                available: Number(row.current_stock),
                unit: row.unit,
              });
            }
          }

          if (shortages.length > 0) {
            allShortages.push(...shortages);
            continue; // Skip this item if there are shortages
          }

          // Deduct raw materials
          for (const row of bomRows) {
            const requiredQty = Number(row.quantity_per_unit) * Number(currentQuantity);
            await tx.execute(
              'UPDATE raw_materials SET current_stock = current_stock - ? WHERE id = ? AND current_stock >= ?',
              [requiredQty, row.raw_material_id, requiredQty]
            );
          }
        }

        // Create manufacturing record
        const [insertRes] = await tx.execute(
          'INSERT INTO manufacturing (item_id, quantity_manufactured, batch_number, staff_name, manufacturing_date, manufacturing_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [currentItemId, currentQuantity, batch_number, staff_name, manufacturing_date, normalizedTime, notes]
        );

        // Update finished good stock
        await tx.execute(
          'UPDATE items SET current_stock = current_stock + ? WHERE id = ?',
          [currentQuantity, currentItemId]
        );

        createdRecords.push({
          id: insertRes.insertId,
          item_id: currentItemId,
          item_name: itemMap[currentItemId],
          quantity_manufactured: currentQuantity,
        });
      }

      // If there were shortages, throw error
      if (allShortages.length > 0) {
        const message = `Insufficient raw materials: ` + allShortages
          .map(s => `${s.item_name} - ${s.raw_material_name} (need ${s.required} ${s.unit}, have ${s.available} ${s.unit})`)
          .join(', ');
        const error = new Error(message);
        error.statusCode = 400;
        throw error;
      }

      return createdRecords;
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.length} manufacturing record(s)`,
      data: results,
      batch_number,
      staff_name,
      manufacturing_date,
      manufacturing_time,
      notes
    });
  } catch (error) {
    console.error('Error creating manufacturing record:', error);
    const status = error.statusCode === 400 ? 400 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to create manufacturing record' });
  }
});

// Update manufacturing record
router.put('/:id', [
  body('item_id').optional().isInt({ min: 1 }).withMessage('Valid item ID is required'),
  body('quantity_manufactured').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('batch_number').optional().notEmpty().withMessage('Batch number cannot be empty'),
  body('staff_name').optional().notEmpty().withMessage('Staff name cannot be empty'),
  body('manufacturing_date').optional().isISO8601().withMessage('Valid manufacturing date is required'),
  body('manufacturing_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required (HH:MM)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { item_id, quantity_manufactured, batch_number, staff_name, manufacturing_date, manufacturing_time, notes } = req.body;
    
    // Get current record
    const [currentRows] = await req.db.execute(
      'SELECT * FROM manufacturing WHERE id = ?',
      [req.params.id]
    );
    
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Manufacturing record not found' });
    }
    
    const currentRecord = currentRows[0];
    
    // Build dynamic query
    const updates = [];
    const values = [];
    
    if (item_id !== undefined) { updates.push('item_id = ?'); values.push(item_id); }
    if (quantity_manufactured !== undefined) { updates.push('quantity_manufactured = ?'); values.push(quantity_manufactured); }
    if (batch_number !== undefined) { updates.push('batch_number = ?'); values.push(batch_number); }
    if (staff_name !== undefined) { updates.push('staff_name = ?'); values.push(staff_name); }
    if (manufacturing_date !== undefined) { updates.push('manufacturing_date = ?'); values.push(manufacturing_date); }
    if (manufacturing_time !== undefined) { updates.push('manufacturing_time = ?'); values.push(manufacturing_time); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    // Update manufacturing record
    const [result] = await req.db.execute(
      `UPDATE manufacturing SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // If quantity changed, update item stock
    if (quantity_manufactured !== undefined) {
      const quantityDiff = quantity_manufactured - currentRecord.quantity_manufactured;
      await req.db.execute(
        'UPDATE items SET current_stock = current_stock + ? WHERE id = ?',
        [quantityDiff, item_id || currentRecord.item_id]
      );
    }
    
    res.json({ success: true, message: 'Manufacturing record updated successfully' });
  } catch (error) {
    console.error('Error updating manufacturing record:', error);
    res.status(500).json({ success: false, error: 'Failed to update manufacturing record' });
  }
});

// Delete manufacturing record
router.delete('/:id', async (req, res) => {
  try {
    // Get current record to adjust stock
    const [currentRows] = await req.db.execute(
      'SELECT * FROM manufacturing WHERE id = ?',
      [req.params.id]
    );
    
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Manufacturing record not found' });
    }
    
    const currentRecord = currentRows[0];
    
    // Delete record
    const [result] = await req.db.execute(
      'DELETE FROM manufacturing WHERE id = ?',
      [req.params.id]
    );
    
    // Adjust item stock
    await req.db.execute(
      'UPDATE items SET current_stock = current_stock - ? WHERE id = ?',
      [currentRecord.quantity_manufactured, currentRecord.item_id]
    );
    
    res.json({ success: true, message: 'Manufacturing record deleted successfully' });
  } catch (error) {
    console.error('Error deleting manufacturing record:', error);
    res.status(500).json({ success: false, error: 'Failed to delete manufacturing record' });
  }
});

module.exports = router;

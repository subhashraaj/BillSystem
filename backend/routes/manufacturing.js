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

// Create new manufacturing record
router.post('/', [
  body('item_id').isInt({ min: 1 }).withMessage('Valid item ID is required'),
  body('quantity_manufactured').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  // Treat empty string as missing
  body('batch_number').optional({ checkFalsy: true }).isString().withMessage('Batch number must be text'),
  body('staff_name').notEmpty().withMessage('Staff name is required'),
  body('manufacturing_date').isISO8601().withMessage('Valid manufacturing date is required'),
  // Accept HH:MM or HH:MM:SS
  body('manufacturing_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/).withMessage('Valid time format is required (HH:MM or HH:MM:SS)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { item_id, quantity_manufactured, batch_number, staff_name, manufacturing_date, manufacturing_time, notes } = req.body;
    // Normalize time to HH:MM:SS for MySQL TIME
    const normalizedTime = manufacturing_time.length === 5 ? `${manufacturing_time}:00` : manufacturing_time;
    
    // Verify item exists
    const [itemRows] = await req.db.execute(
      'SELECT id, name FROM items WHERE id = ?',
      [item_id]
    );
    
    if (itemRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Item not found' });
    }
    // Check BOM requirements and raw material stock inside a transaction
    const result = await req.db.withTransaction(async (tx) => {
      // Fetch BOM for the item
      const [bomRows] = await tx.execute(
        `SELECT ib.raw_material_id, ib.quantity_per_unit, ib.unit, rm.current_stock, rm.name as raw_material_name
         FROM item_bom ib
         JOIN raw_materials rm ON rm.id = ib.raw_material_id
         WHERE ib.item_id = ?`,
        [item_id]
      );

      if (bomRows.length > 0) {
        // Calculate total required quantities
        const shortages = [];
        for (const row of bomRows) {
          const requiredQty = Number(row.quantity_per_unit) * Number(quantity_manufactured);
          if (Number(row.current_stock) < requiredQty) {
            shortages.push({
              raw_material_id: row.raw_material_id,
              raw_material_name: row.raw_material_name,
              required: requiredQty,
              available: Number(row.current_stock),
              unit: row.unit,
            });
          }
        }

        if (shortages.length > 0) {
          const message = `Insufficient raw materials: ` + shortages
            .map(s => `${s.raw_material_name} (need ${s.required} ${s.unit}, have ${s.available} ${s.unit})`)
            .join(', ');
          const error = new Error(message);
          // Attach status for outer catcher
          // @ts-ignore
          error.statusCode = 400;
          throw error;
        }

        // Deduct raw materials
        for (const row of bomRows) {
          const requiredQty = Number(row.quantity_per_unit) * Number(quantity_manufactured);
          await tx.execute(
            'UPDATE raw_materials SET current_stock = current_stock - ? WHERE id = ? AND current_stock >= ?',
            [requiredQty, row.raw_material_id, requiredQty]
          );
        }
      }

      // Create manufacturing record
      const [insertRes] = await tx.execute(
        'INSERT INTO manufacturing (item_id, quantity_manufactured, batch_number, staff_name, manufacturing_date, manufacturing_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item_id, quantity_manufactured, batch_number, staff_name, manufacturing_date, normalizedTime, notes]
      );

      // Update finished good stock
      await tx.execute(
        'UPDATE items SET current_stock = current_stock + ? WHERE id = ?',
        [quantity_manufactured, item_id]
      );

      return insertRes;
    });

    res.status(201).json({
      success: true,
      message: 'Manufacturing record created successfully',
      data: {
        id: result.insertId,
        item_id,
        item_name: itemRows[0].name,
        quantity_manufactured,
        batch_number,
        staff_name,
        manufacturing_date,
        manufacturing_time,
        notes
      }
    });
  } catch (error) {
    console.error('Error creating manufacturing record:', error);
    // @ts-ignore
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

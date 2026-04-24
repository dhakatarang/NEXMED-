// backend/controllers/donaterentController.js
const create = async (req, res) => {
  try {
    console.log('📦 Received donation request from user:', req.user);

    const {
      itemType,
      optionType,
      name,
      description,
      quantity,
      price,
      rentPrice,
      duration,
      termsAccepted
    } = req.body;

    // Use authenticated user's ID
    const effectiveUserId = req.user.id;

    // Handle file upload
    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
      console.log('📁 File uploaded:', imagePath);
    }

    // Validate required fields
    if (!name || !description || !quantity || !termsAccepted) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        success: false,
        error: 'Name, description, quantity, and terms acceptance are required',
        received: { name, description, quantity, termsAccepted }
      });
    }

    // Validate option types based on item type
    if (itemType === 'medicine' && !['donate', 'sell'].includes(optionType)) {
      return res.status(400).json({ 
        success: false,
        error: "For medicines, only 'donate' or 'sell' options are allowed" 
      });
    }

    if (itemType === 'medicalequipment' && !['donate', 'sell', 'rent'].includes(optionType)) {
      return res.status(400).json({ 
        success: false,
        error: "For medical equipment, only 'donate', 'sell', or 'rent' options are allowed" 
      });
    }

    let result;

    if (itemType === 'medicine') {
      const medicineData = {
        name,
        description,
        quantity: parseInt(quantity),
        price: optionType === 'sell' ? parseFloat(price || 0) : 0,
        is_donated: optionType === 'donate',
        image_path: imagePath,
        option_type: optionType,
        added_by: effectiveUserId,
        expiry_date: req.body.expiryDate || null,
        created_at: new Date().toISOString()
      };

      // Insert into medicines table
      const medicineSql = `
        INSERT INTO medicines 
        (name, description, quantity, price, is_donated, image_path, option_type, added_by, expiry_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      result = await new Promise((resolve, reject) => {
        medicinesDB.run(medicineSql, [
          medicineData.name,
          medicineData.description,
          medicineData.quantity,
          medicineData.price,
          medicineData.is_donated ? 1 : 0,
          medicineData.image_path,
          medicineData.option_type,
          medicineData.added_by,
          medicineData.expiry_date,
          medicineData.created_at
        ], function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, type: 'medicine' });
        });
      });

    } else if (itemType === 'medicalequipment') {
      const equipmentData = {
        name,
        description,
        quantity: parseInt(quantity),
        price: optionType === 'sell' ? parseFloat(price || 0) : 0,
        rent_price: optionType === 'rent' ? parseFloat(rentPrice || 0) : 0,
        min_rental_days: optionType === 'rent' ? parseInt(duration || 1) : 0,
        is_for_rent: optionType === 'rent',
        is_donated: optionType === 'donate',
        image_path: imagePath,
        option_type: optionType,
        condition: req.body.condition || 'good',
        added_by: effectiveUserId,
        created_at: new Date().toISOString()
      };

      // Insert into equipments table
      const equipmentSql = `
        INSERT INTO equipments 
        (name, description, quantity, price, rent_price, min_rental_days, is_for_rent, is_donated, image_path, option_type, condition, added_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      result = await new Promise((resolve, reject) => {
        equipmentsDB.run(equipmentSql, [
          equipmentData.name,
          equipmentData.description,
          equipmentData.quantity,
          equipmentData.price,
          equipmentData.rent_price,
          equipmentData.min_rental_days,
          equipmentData.is_for_rent ? 1 : 0,
          equipmentData.is_donated ? 1 : 0,
          equipmentData.image_path,
          equipmentData.option_type,
          equipmentData.condition,
          equipmentData.added_by,
          equipmentData.created_at
        ], function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, type: 'equipment' });
        });
      });
    }

    // Also insert into donaterent table for unified view
    const donaterentSql = `
      INSERT INTO donaterent 
      (user_id, item_type, item_id, option_type, name, description, quantity, price, rent_price, duration, image_path, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await new Promise((resolve, reject) => {
      donateRentDB.run(donaterentSql, [
        effectiveUserId,
        itemType,
        result.id,
        optionType,
        name,
        description,
        parseInt(quantity),
        price ? parseFloat(price) : null,
        rentPrice ? parseFloat(rentPrice) : null,
        duration || null,
        imagePath,
        new Date().toISOString()
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'Item added successfully!',
      data: result
    });

  } catch (error) {
    console.error('💥 Unexpected error in create:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
};
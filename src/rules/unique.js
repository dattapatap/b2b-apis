import connDB from '../config/database.js'; 
import vine  from '@vinejs/vine'

async function unique(value, options, field) {

  if (typeof value !== 'string') {
    return;
  }

  try {   

    await connDB();
    const model = options.model;

    const record = await model.findOne({
      [options.column]: value, 
      isDeleted: false,  
    });

    if (record) {
      field.report(
        'The {{ field }} field must be unique.',
        'unique',
        field
      );
    }

  } catch (error) {
      console.error('Error checking uniqueness:', error);
      field.report('Error checking uniqueness', 'unique', field);
  }
}

export const uniqueRule = vine.createRule(unique);

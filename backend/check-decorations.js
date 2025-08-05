const db = require('./db');
const config = require('./config/config');

async function checkAndFixDecorations() {
  console.log('🔍 Checking decorations in database...');
  
  // Check existing decorations
  db.query('SELECT * FROM decorations WHERE status = "Active"', (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return;
    }
    
    console.log(`📋 Found ${results.length} active decorations`);
    
    if (results.length === 0) {
      console.log('⚠️ No decorations found. Adding sample decorations...');
      addSampleDecorations();
    } else {
      console.log('✅ Decorations found:', results.map(d => ({ id: d.id, name: d.name, plan: d.subscription_plan })));
    }
  });
}

function addSampleDecorations() {
  const sampleDecorations = [
    {
      name: 'Modern Frame',
      category: 'frame',
      image: '/uploads/frame_1.png',
      subscription_plan: 'basic',
      status: 'Active'
    },
    {
      name: 'Elegant Chair',
      category: 'furniture',
      image: '/uploads/chair.png',
      subscription_plan: 'basic',
      status: 'Active'
    },
    {
      name: 'Festive Garland',
      category: 'decoration',
      image: '/uploads/garland-removebg-preview.png',
      subscription_plan: 'basic',
      status: 'Active'
    },
    {
      name: 'Beautiful Flower',
      category: 'decoration',
      image: '/uploads/flower-removebg-preview.png',
      subscription_plan: 'basic',
      status: 'Active'
    },
    {
      name: 'Pro Frame',
      category: 'frame',
      image: '/uploads/frame_1.png',
      subscription_plan: 'pro',
      status: 'Active'
    },
    {
      name: 'Premium Chair',
      category: 'furniture',
      image: '/uploads/chair.png',
      subscription_plan: 'pro',
      status: 'Active'
    }
  ];
  
  sampleDecorations.forEach((decoration, index) => {
    db.query(
      'INSERT INTO decorations (name, category, image, subscription_plan, status) VALUES (?, ?, ?, ?, ?)',
      [decoration.name, decoration.category, decoration.image, decoration.subscription_plan, decoration.status],
      (err, result) => {
        if (err) {
          console.error(`❌ Error adding decoration ${index + 1}:`, err);
        } else {
          console.log(`✅ Added decoration: ${decoration.name} (${decoration.subscription_plan})`);
        }
        
        // Close connection after last decoration
        if (index === sampleDecorations.length - 1) {
          console.log('🎉 Sample decorations added successfully!');
          db.end();
        }
      }
    );
  });
}

// Run the check
checkAndFixDecorations(); 
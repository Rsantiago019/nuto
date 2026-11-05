'use strict';

const db = require('../src/db');
const { slugify } = require('../src/utils');

const categories = [
  { name: 'Autos', position: 1 },
  { name: 'Camionetas', position: 2 }
];

const vehicles = [
  {
    name: 'Toyota Etios XLS Pack 1.5',
    category: 'Autos',
    specs: [
      ['Año', '2023'],
      ['Kilometraje', '27.800 km'],
      ['Versión', 'XLS Pack 1.5']
    ]
  },
  {
    name: 'FORD RANGER DC XL 2.0 4X4 MT D',
    category: 'Camionetas',
    specs: [
      ['Año', '2025'],
      ['Kilometraje', '45.800 km'],
      ['Motor', '2.0'],
      ['Tracción', '4x4'],
      ['Transmisión', 'Manual'],
      ['Combustible', 'Diésel']
    ]
  }
];

async function importStock() {
  await db.initialize();
  await db.transaction(async client => {
    const categoryIds = new Map();
    for (const category of categories) {
      const slug = slugify(category.name);
      const existing = await client.query(
        'SELECT id FROM categories WHERE slug = $1 OR LOWER(name) = LOWER($2) LIMIT 1',
        [slug, category.name]
      );
      if (existing.rowCount) {
        categoryIds.set(category.name, existing.rows[0].id);
        continue;
      }
      const inserted = await client.query(
        'INSERT INTO categories (name, slug, position) VALUES ($1, $2, $3) RETURNING id',
        [category.name, slug, category.position]
      );
      categoryIds.set(category.name, inserted.rows[0].id);
    }

    for (const vehicle of vehicles) {
      const slug = slugify(vehicle.name);
      const specs = JSON.stringify(vehicle.specs.map(([label, value]) => ({ label, value })));
      await client.query(
        `INSERT INTO products (name, slug, category_id, description, specs, status)
         VALUES ($1, $2, $3, '', $4::jsonb, 'active')
         ON CONFLICT (slug) DO UPDATE SET
           category_id = EXCLUDED.category_id,
           specs = EXCLUDED.specs,
           status = 'active',
           updated_at = CURRENT_TIMESTAMP`,
        [vehicle.name, slug, categoryIds.get(vehicle.category), specs]
      );
    }
  });
  console.log('Toyota Etios y Ford Ranger agregados/actualizados sin borrar otras unidades.');
  console.log('Suba las fotos de cada vehículo desde el panel para reemplazar la imagen provisional.');
}

importStock()
  .catch(error => {
    console.error('[ERROR] No se pudo importar el inventario de Nuto:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
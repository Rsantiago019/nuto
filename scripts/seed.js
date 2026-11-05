'use strict';
const db = require('../src/db');
const { slugify } = require('../src/utils');
const { removeFiles } = require('../src/upload');

const reset = process.argv.includes('--reset');
const CATEGORIES = ['Autos', 'Camionetas', 'Motos Beta'];
const NOTE = ' Ficha demostrativa: reemplace estos datos por los de una unidad real desde el panel.';
const PRODUCTS = [
  { name: 'Auto usado modelo de ejemplo', cat: 'Autos', status: 'active', description: 'Ficha para mostrar el formato de una publicación de auto usado.' + NOTE, specs: [['Estado', 'Usado'], ['Año', '2021'], ['Kilometraje', '65.000 km'], ['Combustible', 'Consultar']] },
  { name: 'Camioneta modelo de ejemplo', cat: 'Camionetas', status: 'active', description: 'Ficha para mostrar el formato de una publicación de camioneta.' + NOTE, specs: [['Estado', 'Usado'], ['Año', '2022'], ['Kilometraje', 'Consultar'], ['Tracción', 'Consultar']] },
  { name: 'Moto Beta modelo de ejemplo', cat: 'Motos Beta', status: 'active', description: 'Ficha para mostrar el formato de una publicación de moto Beta.' + NOTE, specs: [['Estado', 'Nueva o usada'], ['Año', 'Consultar'], ['Kilometraje', 'Consultar'], ['Modelo', 'Consultar']] },
  { name: 'Vehículo borrador (inactivo)', cat: 'Autos', status: 'inactive', description: 'Ejemplo de una publicación en preparación; no se muestra en el catálogo público.', specs: [['Estado', 'En preparación']] }
];

(async () => {
  await db.initialize();
  const existing = await db.query('SELECT COUNT(*)::integer AS count FROM products');
  if (existing.rows[0].count && !reset) {
    console.log('Ya hay productos cargados. Use --reset para reemplazarlos por los de ejemplo.');
    return;
  }

  const oldImages = reset
    ? (await db.query('SELECT filename FROM product_images')).rows.map(image => image.filename)
    : [];
  await db.transaction(async client => {
    if (reset) {
      await client.query('DELETE FROM products');
      await client.query('DELETE FROM categories');
    }
    const categoryIds = new Map();
    for (const [index, name] of CATEGORIES.entries()) {
      const inserted = await client.query(
        'INSERT INTO categories (name, slug, position) VALUES ($1, $2, $3) RETURNING id',
        [name, slugify(name), index + 1]
      );
      categoryIds.set(name, inserted.rows[0].id);
    }
    for (const product of PRODUCTS) {
      const inserted = await client.query(
        `INSERT INTO products (name, slug, category_id, description, specs, status)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6) RETURNING id`,
        [
          product.name,
          slugify(product.name),
          categoryIds.get(product.cat),
          product.description,
          JSON.stringify(product.specs.map(([label, value]) => ({ label, value }))),
          product.status
        ]
      );
      await client.query(
        'INSERT INTO product_images (product_id, filename, position) VALUES ($1, $2, 0)',
        [inserted.rows[0].id, '/img/vehicle-placeholder.svg']
      );
    }
  });
  await removeFiles(oldImages);
  console.log(`Datos de ejemplo cargados: ${CATEGORIES.length} tipos y ${PRODUCTS.length} productos.`);
})().catch(error => {
  console.error('[ERROR] No se pudieron cargar los datos de ejemplo:', error);
  process.exitCode = 1;
}).finally(() => db.close());

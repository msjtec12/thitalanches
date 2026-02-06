import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const categories = [
  { id: '1', name: 'Lanches', order: 1 },
  { id: '2', name: 'Porções', order: 2 },
  { id: '3', name: 'Bebidas', order: 3 },
  { id: '4', name: 'Sobremesas', order: 4 },
];

const products = [
  {
    id: '1',
    name: 'X-Burger',
    description: 'Pão, hambúrguer 150g, queijo, alface, tomate e maionese',
    price: 18.90,
    costPrice: 8.50,
    isActive: true,
    categoryId: '1',
    extras: [
      { id: 'e1', name: 'Bacon', price: 4.00, isActive: true },
      { id: 'e2', name: 'Ovo', price: 3.00, isActive: true },
    ]
  },
  {
    id: '2',
    name: 'Batata Frita',
    description: 'Porção individual de batata frita crocante',
    price: 12.00,
    costPrice: 4.50,
    isActive: true,
    categoryId: '2'
  }
];

const neighborhoods = [
    { id: '1', name: 'Nova Aliança', deliveryFee: 3.00, estimatedDistanceKm: 1.5, allowedStreets: [] },
    { id: '2', name: 'N. Aliança Sul', deliveryFee: 4.00, estimatedDistanceKm: 2.0, allowedStreets: [] },
    { id: '3', name: 'V. Ana Maria', deliveryFee: 4.00, estimatedDistanceKm: 1.8, allowedStreets: [] },
    { id: '4', name: 'Jd. João Rossi', deliveryFee: 4.00, estimatedDistanceKm: 2.5, allowedStreets: [] },
    { id: '5', name: 'Parque das Artes', deliveryFee: 4.00, estimatedDistanceKm: 2.2, allowedStreets: [] },
    { id: '6', name: 'Hotel JF', deliveryFee: 4.00, estimatedDistanceKm: 1.5, allowedStreets: [] },
    { id: '7', name: 'Hotel Ibis Styls', deliveryFee: 4.00, estimatedDistanceKm: 1.6, allowedStreets: [] },
    { id: '8', name: 'Hotel Tryp', deliveryFee: 4.00, estimatedDistanceKm: 1.7, allowedStreets: [] },
    { id: '9', name: 'Hotel Sta Felicidade', deliveryFee: 4.00, estimatedDistanceKm: 1.8, allowedStreets: [] },
    { id: '10', name: 'Hotel Ideali', deliveryFee: 5.00, estimatedDistanceKm: 2.5, allowedStreets: [] },
    { id: '11', name: 'Hotel Ibis Shop', deliveryFee: 5.00, estimatedDistanceKm: 2.6, allowedStreets: [] },
    { id: '12', name: 'Ribeirão Shopping', deliveryFee: 5.00, estimatedDistanceKm: 2.7, allowedStreets: [] },
    { id: '13', name: 'Jd. Califórnia', deliveryFee: 6.00, estimatedDistanceKm: 3.0, allowedStreets: [] },
    { id: '14', name: 'Irajá', deliveryFee: 6.00, estimatedDistanceKm: 3.2, allowedStreets: [] },
    { id: '15', name: 'Jd. Flórida', deliveryFee: 6.00, estimatedDistanceKm: 3.5, allowedStreets: [] },
    { id: '16', name: 'Hospital UNIMED', deliveryFee: 8.00, estimatedDistanceKm: 4.0, allowedStreets: [] },
    { id: '17', name: 'Av. Portugal', deliveryFee: 8.00, estimatedDistanceKm: 4.2, allowedStreets: [] },
    { id: '18', name: 'Av. Caramuru', deliveryFee: 8.00, estimatedDistanceKm: 4.5, allowedStreets: [] },
    { id: '19', name: 'Jd. Sumaré', deliveryFee: 8.00, estimatedDistanceKm: 4.8, allowedStreets: [] },
    { id: '20', name: 'Boulevard', deliveryFee: 8.00, estimatedDistanceKm: 5.0, allowedStreets: [] },
    { id: '21', name: 'Quinta da Alvorada', deliveryFee: 8.00, estimatedDistanceKm: 5.2, allowedStreets: [] },
    { id: '22', name: 'Jd. Alvorada', deliveryFee: 8.00, estimatedDistanceKm: 5.5, allowedStreets: [] },
    { id: '23', name: 'Morro do Ipê', deliveryFee: 8.00, estimatedDistanceKm: 5.8, allowedStreets: [] },
    { id: '24', name: 'Bosque dos Juriti', deliveryFee: 8.00, estimatedDistanceKm: 6.0, allowedStreets: [] },
    { id: '25', name: 'Jd. São Luiz', deliveryFee: 8.00, estimatedDistanceKm: 6.2, allowedStreets: [] },
    { id: '26', name: 'Vila Seixas', deliveryFee: 8.00, estimatedDistanceKm: 6.5, allowedStreets: [] },
    { id: '27', name: 'Hosp. Sta Tereza', deliveryFee: 8.00, estimatedDistanceKm: 6.8, allowedStreets: [] },
    { id: '28', name: 'Av. Adelmo Perdiza', deliveryFee: 8.00, estimatedDistanceKm: 7.0, allowedStreets: [] },
    { id: '29', name: 'Botânico', deliveryFee: 8.00, estimatedDistanceKm: 7.2, allowedStreets: [] },
    { id: '30', name: 'Jd. Piratininga', deliveryFee: 8.00, estimatedDistanceKm: 7.5, allowedStreets: [] },
    { id: '31', name: 'Parque Rib.', deliveryFee: 8.00, estimatedDistanceKm: 7.8, allowedStreets: [] },
    { id: '32', name: 'Vila Guiomar', deliveryFee: 8.00, estimatedDistanceKm: 8.0, allowedStreets: [] },
    { id: '33', name: 'Jd. Progresso', deliveryFee: 8.00, estimatedDistanceKm: 8.2, allowedStreets: [] },
    { id: '34', name: 'Av. Toledo (Após 1000)', deliveryFee: 6.00, estimatedDistanceKm: 3.0, allowedStreets: [] },
    { id: '35', name: 'Av. Toledo (Após 2000)', deliveryFee: 8.00, estimatedDistanceKm: 4.0, allowedStreets: [] },
    { id: '36', name: 'Av. Toledo (Após 3000)', deliveryFee: 10.00, estimatedDistanceKm: 5.0, allowedStreets: [] },
    { id: '37', name: 'Olhos D´Água (Até 400)', deliveryFee: 8.00, estimatedDistanceKm: 4.5, allowedStreets: [] },
    { id: '38', name: 'Olhos D´Água (Após 1000)', deliveryFee: 10.00, estimatedDistanceKm: 6.0, allowedStreets: [] },
    { id: '39', name: 'Vila Virginia', deliveryFee: 9.00, estimatedDistanceKm: 5.5, allowedStreets: [] },
    { id: '40', name: 'Centro', deliveryFee: 10.00, estimatedDistanceKm: 6.0, allowedStreets: [] },
    { id: '41', name: 'Vila do Golfe', deliveryFee: 10.00, estimatedDistanceKm: 6.5, allowedStreets: [] },
    { id: '42', name: 'Alto do Ipê', deliveryFee: 10.00, estimatedDistanceKm: 7.0, allowedStreets: [] },
    { id: '43', name: 'Higienópolis', deliveryFee: 10.00, estimatedDistanceKm: 7.5, allowedStreets: [] },
    { id: '44', name: 'City R.', deliveryFee: 10.00, estimatedDistanceKm: 8.0, allowedStreets: [] },
    { id: '45', name: 'Jd. das Américas', deliveryFee: 10.00, estimatedDistanceKm: 8.5, allowedStreets: [] },
    { id: '46', name: 'Ribeirânia', deliveryFee: 11.00, estimatedDistanceKm: 9.0, allowedStreets: [] },
    { id: '47', name: 'Bonfim Paulista', deliveryFee: 12.00, estimatedDistanceKm: 10.0, allowedStreets: [] },
    { id: '48', name: 'Sta Cecília', deliveryFee: 12.00, estimatedDistanceKm: 10.5, allowedStreets: [] },
    { id: '49', name: 'Royal Parque', deliveryFee: 12.00, estimatedDistanceKm: 11.0, allowedStreets: [] },
    { id: '50', name: 'Guaporé', deliveryFee: 12.00, estimatedDistanceKm: 11.5, allowedStreets: [] },
    { id: '51', name: 'Sta Martha', deliveryFee: 13.00, estimatedDistanceKm: 12.0, allowedStreets: [] },
    { id: '52', name: 'Jd. Paulista', deliveryFee: 13.00, estimatedDistanceKm: 12.5, allowedStreets: [] },
    { id: '53', name: 'Manoel Penna', deliveryFee: 14.00, estimatedDistanceKm: 13.0, allowedStreets: [] },
    { id: '54', name: 'Av. do Café', deliveryFee: 14.00, estimatedDistanceKm: 13.5, allowedStreets: [] },
    { id: '55', name: 'Jd. Paulistano', deliveryFee: 14.00, estimatedDistanceKm: 14.0, allowedStreets: [] },
    { id: '56', name: 'Vivedas da Mata', deliveryFee: 15.00, estimatedDistanceKm: 15.0, allowedStreets: [] },
    { id: '57', name: 'Alphaville', deliveryFee: 15.00, estimatedDistanceKm: 16.0, allowedStreets: [] },
];

async function seed() {
  console.log('🌱 Starting seed...');
  
  try {
    // 1. Categories and Products
    for (const cat of categories) {
      console.log(`Adding category: ${cat.name}`);
      const { data: newCat } = await supabase.from('categories').insert({
        name: cat.name,
        sort_order: cat.order
      }).select().single();
      
      if (newCat) {
        const catProducts = products.filter(p => p.categoryId === cat.id);
        for (const prod of catProducts) {
           console.log(`  Adding product: ${prod.name}`);
           const { data: newProd } = await supabase.from('products').insert({
             name: prod.name,
             description: prod.description,
             price: prod.price,
             cost_price: prod.costPrice,
             is_active: prod.isActive,
             category_id: newCat.id
           }).select().single();
           
           if (newProd && prod.extras) {
             for (const extra of prod.extras) {
               await supabase.from('product_extras').insert({
                 product_id: newProd.id,
                 name: extra.name,
                 price: extra.price,
                 is_active: extra.isActive
               });
             }
           }
        }
      }
    }

    // 2. Neighborhoods
    console.log('Adding neighborhoods...');
    for (const nb of neighborhoods) {
        await supabase.from('neighborhoods').insert({
            name: nb.name,
            delivery_fee: nb.deliveryFee,
            estimated_distance_km: nb.estimatedDistanceKm,
            allowed_streets: nb.allowedStreets
        });
    }

    console.log('✅ Seed finished successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

seed();

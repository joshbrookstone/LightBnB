/* eslint-disable camelcase */
const db = require('./db/index');
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return db.query(`
  SELECT users.*
  FROM users
  WHERE email = $1
  LIMIT 1;
  `, [email])
    .then(res => res.rows[0]);
    
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return db.query(`
  SELECT users.*
  FROM users
  WHERE id = $1
  LIMIT 1;
  `, [id])
    .then(res => res.rows[0]);
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return db.query(`
  INSERT INTO users (name,password,email)
  VALUES ($1,$2,$3)
  RETURNING *
 `,[user.name,user.password,user.email])
    .then(res => res.rows[0]);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return db.query(`
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $2
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $1
  `,[limit, guest_id])
    .then(res => res.rows);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  let hasPreviousClause = false;
  const queryParams = [];
  
  
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  
  if (options.city) {
    queryParams.push(`%${options.city.toUpperCase()}%`);
    queryString += `WHERE UPPER(city) LIKE $${queryParams.length} `;
    hasPreviousClause = true;
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `${hasPreviousClause ? 'AND' : 'WHERE'} owner_id = $${queryParams.length}`;
    hasPreviousClause = true;
  }


  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`, `${options.maximum_price_per_night}`);
    queryString += `${hasPreviousClause ? 'AND' : 'WHERE'} cost_per_night > $${queryParams.length - 1} AND cost_per_night < $${queryParams.length} `;
    hasPreviousClause = true;
  }

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `${hasPreviousClause ? 'AND' : 'WHERE'} rating >= $${queryParams.length}`;
    hasPreviousClause = true;
  }

  queryParams.push(limit);

  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  


  
  return db.query(queryString, queryParams)
    .then(res => res.rows);
};


exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  return db.query(`
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *
  `, [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms, property.country, property.street, property.city, property.province, property.post_code])
    .then(res => res.rows[0]);

   
  
};
exports.addProperty = addProperty;

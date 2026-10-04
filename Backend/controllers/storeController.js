const db = require('../config/db');

/**
 * Controller to fetch all stores for authenticated users.
 * Computes overall average rating while retrieving the current user's submitted rating.
 */
const getAllStoresForUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Authentication required.'
      });
    }

    const userId = req.user.id;
    const { name, address, sortBy, order } = req.query;
    // Parameter array initialized with current user ID for the userRating join
    const queryParams = [userId];
    const whereConditions = [];

    // Filter by store name (partial, case-insensitive match)
    if (typeof name === 'string' && name.trim() !== '') {
      whereConditions.push('s.name LIKE ?');
      queryParams.push(`%${name.trim()}%`);
    }

    // Filter by store address (partial, case-insensitive match)
    if (typeof address === 'string' && address.trim() !== '') {
      whereConditions.push('s.address LIKE ?');
      queryParams.push(`%${address.trim()}%`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Allow-list for sortable fields to prevent SQL injection
    const sortAllowList = {
      name: 's.name',
      address: 's.address',
      rating: 'overallRating'
    };

    const sortKey = typeof sortBy === 'string' ? sortBy.toLowerCase().trim() : 'name';
    const sortColumn = sortAllowList[sortKey] || 's.name';

    // Validate sort direction (default to ASC)
    const sortDirection = typeof order === 'string' && order.toUpperCase().trim() === 'DESC'
      ? 'DESC'
      : 'ASC';

    // Query combines all ratings for average and isolates logged-in user rating
    const query = `
      SELECT
        s.id,
        s.name,
        s.address,
        ROUND(COALESCE(AVG(r.rating), 0), 2) AS overallRating,
        MAX(ur.rating) AS userRating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      LEFT JOIN ratings ur ON s.id = ur.store_id AND ur.user_id = ?
      ${whereClause}
      GROUP BY s.id, s.name, s.address
      ORDER BY ${sortColumn} ${sortDirection}
    `;

    const [rows] = await db.query(query, queryParams);

    // Format fields to ensure exact types for frontend consumption
    const stores = rows.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      overallRating: Number(parseFloat(store.overallRating || 0).toFixed(2)),
      userRating: store.userRating !== null && store.userRating !== undefined
        ? Number(store.userRating)
        : null
    }));

    return res.status(200).json({
      message: 'Stores fetched successfully.',
      count: stores.length,
      stores
    });
  } catch (error) {
    console.error('Error fetching stores for user:', error);
    return res.status(500).json({
      message: 'Internal server error while fetching stores.'
    });
  }
};

module.exports = {
  getAllStoresForUser
};
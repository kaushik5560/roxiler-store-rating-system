const db = require('../config/db');

/**
 * Controller to fetch owner dashboard metrics and raters for stores owned by the authenticated owner.
 * Route: GET /api/owner/dashboard
 * Access: Private (Store Owner only)
 */
const getOwnerDashboard = async (req, res) => {
  try {
    // 1. Enforce authenticated owner presence
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Authentication required. Access denied.'
      });
    }

    const ownerId = Number(req.user.id);

    // 2. Fetch all stores owned by this owner with aggregated average rating and total counts
    const storesQuery = `
      SELECT 
        s.id,
        s.name,
        s.email,
        s.address,
        ROUND(COALESCE(AVG(r.rating), 0), 2) AS averageRating,
        COUNT(r.id) AS ratingsCount
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE s.owner_id = ?
      GROUP BY s.id, s.name, s.email, s.address
      ORDER BY s.id ASC
    `;

    const [stores] = await db.query(storesQuery, [ownerId]);

    // Handle case where owner does not have any registered stores
    if (stores.length === 0) {
      return res.status(200).json({
        message: 'Owner dashboard fetched successfully.',
        stores: []
      });
    }

    // 3. Fetch raters details for all stores belonging to this owner in a single query (avoiding N+1)
    const ratersQuery = `
      SELECT 
        r.store_id,
        u.id AS userId,
        u.name,
        u.email,
        u.address,
        r.rating,
        r.updated_at AS ratedAt
      FROM ratings r
      INNER JOIN stores s ON r.store_id = s.id
      INNER JOIN users u ON r.user_id = u.id
      WHERE s.owner_id = ?
      ORDER BY r.updated_at DESC
    `;

    const [ratersRows] = await db.query(ratersQuery, [ownerId]);

    // 4. Map raters by store_id for fast in-memory association
    const ratersByStoreId = {};
    for (const row of ratersRows) {
      if (!ratersByStoreId[row.store_id]) {
        ratersByStoreId[row.store_id] = [];
      }
      ratersByStoreId[row.store_id].push({
        userId: row.userId,
        name: row.name,
        email: row.email,
        address: row.address,
        rating: Number(row.rating),
        ratedAt: row.ratedAt
      });
    }

    // 5. Structure clean response payload
    const formattedStores = stores.map((store) => ({
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      averageRating: Number(parseFloat(store.averageRating || 0).toFixed(2)),
      ratingsCount: Number(store.ratingsCount) || 0,
      raters: ratersByStoreId[store.id] || []
    }));

    return res.status(200).json({
      message: 'Owner dashboard fetched successfully.',
      stores: formattedStores
    });
  } catch (error) {
    console.error('Error fetching owner dashboard:', error);
    return res.status(500).json({
      message: 'Internal server error while fetching owner dashboard.'
    });
  }
};

module.exports = {
  getOwnerDashboard
};
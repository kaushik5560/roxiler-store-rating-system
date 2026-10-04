const db = require('../config/db');

/**
 * Submit a new rating or update an existing rating for a store.
 */
const submitOrUpdateRating = async (req, res) => {
  try {
    // 1. Verify user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Authentication required. Please log in.'
      });
    }

    const userId = Number(req.user.id);

    // 2. Validate storeId from route parameters
    const { storeId } = req.params;
    const parsedStoreId = Number(storeId);

    if (!Number.isInteger(parsedStoreId) || parsedStoreId <= 0) {
      return res.status(400).json({
        message: 'Invalid store ID. Must be a positive integer.'
      });
    }

    // 3. Validate rating from request body (must be an integer from 1 to 5)
    const { rating } = req.body;
    const parsedRating = Number(rating);

    if (
      rating === undefined ||
      rating === null ||
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return res.status(400).json({
        message: 'Invalid rating. Rating must be an integer between 1 and 5.'
      });
    }

    // 4. Verify whether the target store exists
    const [stores] = await db.query(
      'SELECT id FROM stores WHERE id = ?',
      [parsedStoreId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        message: 'Store not found.'
      });
    }

    // 5. Check if the user has already rated this store
    const [existingRatings] = await db.query(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [userId, parsedStoreId]
    );

    // 6. Update existing rating if found
    if (existingRatings.length > 0) {
      const ratingId = existingRatings[0].id;

      await db.query(
        'UPDATE ratings SET rating = ? WHERE id = ?',
        [parsedRating, ratingId]
      );

      return res.status(200).json({
        message: 'Rating updated successfully.',
        rating: {
          id: ratingId,
          userId,
          storeId: parsedStoreId,
          rating: parsedRating
        }
      });
    }

    // 7. Insert new rating if none exists
    const [result] = await db.query(
      'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
      [userId, parsedStoreId, parsedRating]
    );

    return res.status(201).json({
      message: 'Rating submitted successfully.',
      rating: {
        id: result.insertId,
        userId,
        storeId: parsedStoreId,
        rating: parsedRating
      }
    });
  } catch (error) {
    console.error('Error submitting or updating rating:', error);
    return res.status(500).json({
      message: 'Internal server error while processing rating.'
    });
  }
};

module.exports = {
  submitOrUpdateRating
};
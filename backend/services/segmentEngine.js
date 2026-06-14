/**
 * Segment Engine
 * Converts user segmentation rules (JSON array) into a MongoDB query object.
 */

/**
 * Converts a rules array to a MongoDB filter query.
 * @param {Array} rules - Array of rule objects. Example: [{ field: 'totalSpend', operator: 'gt', value: 2000 }]
 * @returns {Object} - MongoDB query object.
 */
function buildQuery(rules) {
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return {};
  }

  const query = {};

  rules.forEach(rule => {
    const { field, operator, value } = rule;
    
    // Map operator strings to MongoDB query operators
    let mongoOp = '';
    switch (operator) {
      case 'gt':
        mongoOp = '$gt';
        break;
      case 'lt':
        mongoOp = '$lt';
        break;
      case 'gte':
        mongoOp = '$gte';
        break;
      case 'lte':
        mongoOp = '$lte';
        break;
      case 'eq':
        mongoOp = '$eq';
        break;
      default:
        mongoOp = '$eq';
    }

    if (field === 'daysSinceLastOrder') {
      // Convert days to a Date limit comparison on lastOrderDate
      // For example, "daysSinceLastOrder > 60" means the last order was MORE than 60 days ago.
      // Therefore, lastOrderDate is LESS than (older than) the date 60 days ago.
      // We invert the operator for Date comparison because a larger duration since last order
      // implies an older (smaller) date value.
      
      const dateLimit = new Date(Date.now() - value * 24 * 60 * 60 * 1000);
      let invertedMongoOp = '';
      
      switch (operator) {
        case 'gt':
          invertedMongoOp = '$lt';
          break;
        case 'lt':
          invertedMongoOp = '$gt';
          break;
        case 'gte':
          invertedMongoOp = '$lte';
          break;
        case 'lte':
          invertedMongoOp = '$gte';
          break;
        case 'eq':
          invertedMongoOp = '$eq';
          break;
        default:
          invertedMongoOp = '$lt';
      }

      // If lastOrderDate doesn't exist yet, we initialize or merge
      if (!query.lastOrderDate) {
        query.lastOrderDate = {};
      }
      query.lastOrderDate[invertedMongoOp] = dateLimit;
    } else {
      // Standard numeric fields: totalSpend, orderCount
      if (!query[field]) {
        query[field] = {};
      }
      query[field][mongoOp] = value;
    }
  });

  return query;
}

module.exports = {
  buildQuery
};

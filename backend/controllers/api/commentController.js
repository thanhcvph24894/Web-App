const Comment = require('../../models/Comment');
const Order = require('../../models/Order');

// Tạo comment mới
exports.createComment = async (req, res) => {
  try {
    const { orderId, productId, rating, content } = req.body;
    const userId = req.user._id;

    // Kiểm tra xem user đã mua sản phẩm này chưa
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      'items.product': productId,
      //status: 'Đã giao hàng'
    });

    // if (!order) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Bạn chưa mua sản phẩm này hoặc đơn hàng chưa được giao'
    //   });
    // }

    // Kiểm tra xem user đã comment sản phẩm này trong đơn hàng chưa
    const existingComment = await Comment.findOne({
      user: userId,
      product: productId,
      order: orderId
    });

    if (existingComment) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá sản phẩm này trong đơn hàng'
      });
    }

    // Tạo comment mới
    const comment = new Comment({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      content
    });

    await comment.save();

    res.status(201).json({
      success: true,
      message: 'Đánh giá sản phẩm thành công',
      data: comment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi đánh giá sản phẩm'
    });
  }
};

// Lấy danh sách comment của sản phẩm
exports.getProductComments = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ product: productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ product: productId });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting product comments:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách đánh giá'
    });
  }
};

// Kiểm tra xem user đã comment sản phẩm trong đơn hàng chưa
exports.checkUserComment = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findOne({
      user: userId,
      product: productId,
      order: orderId
    });

    res.json({
      success: true,
      data: {
        hasCommented: !!comment,
        comment: comment || null
      }
    });
  } catch (error) {
    console.error('Error checking user comment:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi kiểm tra đánh giá'
    });
  }
}; 
import User from "../models/User.js";

/**
 * @desc    Get all businesses (professionals)
 * @route   GET /api/admin/businesses
 * @access  Private/Admin
 */
export const getAllBusinesses = async (req, res) => {
  try {
    const businesses = await User.find({ role: "Professional" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: businesses.length,
      businesses
    });
  } catch (error) {
    console.error("GetAllBusinesses Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Verify/unverify a business
 * @route   PUT /api/admin/businesses/:id/verify
 * @access  Private/Admin
 */
export const verifyBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const business = await User.findById(id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    if (business.role !== "Professional") {
      return res.status(400).json({
        success: false,
        message: "User is not a business/professional account"
      });
    }

    business.isApproved = isApproved;
    await business.save();

    res.status(200).json({
      success: true,
      message: `Business ${isApproved ? "verified" : "unverified"} successfully`,
      business: {
        _id: business._id,
        name: business.name,
        email: business.email,
        isApproved: business.isApproved
      }
    });
  } catch (error) {
    console.error("VerifyBusiness Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error("GetAllUsers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("DeleteUser Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
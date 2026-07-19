import User from "../models/User.js";
import mongoose from "mongoose";

// Get categories
export const getCategories = async (req, res) => {
  try {
    const categories = [
      { _id: "1", name: "Healthcare" },
      { _id: "2", name: "Beauty & Salon" },
      { _id: "3", name: "Fitness" },
      { _id: "4", name: "Dental" },
      { _id: "5", name: "Legal" },
      { _id: "6", name: "Education" },
      { _id: "7", name: "Restaurant" },
      { _id: "8", name: "Consulting" },
      { _id: "9", name: "Other" }
    ];
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error("GetCategories Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create business (professional account)
export const createBusiness = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      slug,
      description,
      email,
      phone,
      website,
      country,
      city,
      address,
      appointmentDuration,
      depositAmount,
      currency,
      workingDays,
      workingHours,
      categoryId,
      profession,
      appointmentFee
    } = req.body;

    // Check if user already has a business
    const existingBusiness = await User.findOne({
      _id: userId,
      role: 'Professional'
    });

    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        message: "You already have a business account"
      });
    }

    // Update user to Professional role with business details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        role: 'Professional',
        isApproved: false,
        organization: name,
        profession: profession || 'Service Provider',
        appointmentFee: appointmentFee || depositAmount || 0,
        workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: workingHours || { start: '09:00', end: '17:00' }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(201).json({
      success: true,
      message: "Business created successfully. Waiting for admin approval.",
      business: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isApproved: updatedUser.isApproved,
        organization: updatedUser.organization,
        profession: updatedUser.profession
      }
    });
  } catch (error) {
    console.error("CreateBusiness Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get my business
export const getMyBusiness = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'Professional') {
      return res.status(404).json({
        success: false,
        message: "No business found"
      });
    }

    res.status(200).json({
      success: true,
      business: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isApproved: user.isApproved,
        organization: user.organization,
        profession: user.profession,
        appointmentFee: user.appointmentFee,
        workingDays: user.workingDays,
        workingHours: user.workingHours,
        profileImage: user.profileImage,
        ratingAvg: 0,
        ratingCount: 0
      }
    });
  } catch (error) {
    console.error("GetMyBusiness Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get business by slug
export const getBusinessBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find professional by slug (search in name field with slug format)
    const professional = await User.findOne({
      name: { $regex: new RegExp(slug.replace(/-/g, ' '), 'i') },
      role: 'Professional'
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    res.status(200).json({
      success: true,
      business: {
        _id: professional._id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
        description: professional.profession || '',
        city: professional.organization || '',
        country: '',
        ratingAvg: 0,
        bannerUrl: professional.profileImage || '',
        workingHours: professional.workingHours || [],
        appointmentDuration: 30,
        isApproved: professional.isApproved,
        profession: professional.profession,
        appointmentFee: professional.appointmentFee,
        workingDays: professional.workingDays,
        services: [],
        organizationId: professional.organization
      }
    });
  } catch (error) {
    console.error("GetBusinessBySlug Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Explore businesses with search
export const exploreBusinesses = async (req, res) => {
  try {
    const { search, limit = 48 } = req.query;

    // Build search query
    let query = { role: 'Professional', isApproved: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { profession: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const businesses = await User.find(query)
      .select('name email phone organization profession specialization profileImage isApproved')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Transform to match frontend expectations
    const transformed = businesses.map(b => ({
      _id: b._id,
      id: b._id,
      name: b.name,
      slug: b.name.toLowerCase().replace(/\s+/g, '-'),
      description: b.profession || '',
      bannerUrl: b.profileImage || '',
      banner_url: b.profileImage || '',
      city: b.organization?.split(',')[0] || '',
      country: '',
      ratingAvg: 0,
      rating_avg: 0,
      organization: b.organization,
      profession: b.profession,
      specialization: b.specialization,
      isApproved: b.isApproved
    }));

    res.status(200).json({
      success: true,
      count: transformed.length,
      businesses: transformed
    });
  } catch (error) {
    console.error("ExploreBusinesses Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
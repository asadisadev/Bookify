import Organization from "../models/Organization.js";

/**
 * @desc    Create a new organization
 * @route   POST /api/organizations
 * @access  Private
 */
export const createOrganization = async (req, res) => {
    try {
        const {
            name,
            category,
            address,
            city,
            phone,
            email,
            description,
            logo
        } = req.body;

        // Basic validation
        if (!name || !category || !address || !city || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields (name, category, address, city, phone, email)"
            });
        }

        // Check if organization name already exists
        const orgExists = await Organization.findOne({ name });
        if (orgExists) {
            return res.status(400).json({
                success: false,
                message: "An organization with this name already exists"
            });
        }

        // Create organization (isApproved defaults to false via schema, createdBy is set to logged in user)
        const organization = await Organization.create({
            name,
            category,
            address,
            city,
            phone,
            email,
            description: description || "",
            logo: logo || "",
            createdBy: req.user._id,
            isApproved: false // Force pending approval
        });

        res.status(201).json({
            success: true,
            message: "Organization created successfully and is pending approval",
            organization
        });
    } catch (error) {
        console.error("Create Organization Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

/**
 * @desc    Get all approved organizations (with optional search filter)
 * @route   GET /api/organizations
 * @access  Public
 */
export const getOrganizations = async (req, res) => {
    try {
        const { name } = req.query;
        let query = { isApproved: true };

        // Support search by name
        if (name) {
            query.name = { $regex: name, $options: "i" };
        }

        const organizations = await Organization.find(query)
            .populate("createdBy", "name email phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: organizations.length,
            organizations
        });
    } catch (error) {
        console.error("Get Organizations Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

/**
 * @desc    Get organization by ID
 * @route   GET /api/organizations/:id
 * @access  Public
 */
export const getOrganizationById = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id)
            .populate("createdBy", "name email phone");

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        res.status(200).json({
            success: true,
            organization
        });
    } catch (error) {
        console.error("Get Organization By ID Error:", error);
        // Handle cast error for invalid ObjectIds
        if (error.kind === "ObjectId") {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

/**
 * @desc    Approve an organization
 * @route   PUT /api/organizations/:id/approve
 * @access  Private (Admin only)
 */
export const approveOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        // Set approved status
        organization.isApproved = true;
        await organization.save();

        res.status(200).json({
            success: true,
            message: `Organization '${organization.name}' has been successfully approved`,
            organization
        });
    } catch (error) {
        console.error("Approve Organization Error:", error);
        if (error.kind === "ObjectId") {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Product, ProductDocument } from '@/database/schemas/product.schema';
import { UpdateProductStatsDto } from '../dto/update-product-stats.dto';

@Injectable()
export class ProductClientService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;
    const query: any = { isActive: true };

    // Apply date-based availability filters
    const now = new Date();
    query.$or = [{ availableFrom: { $exists: false } }, { availableFrom: null }, { availableFrom: { $lte: now } }];

    query.$and = [
      {
        $or: [{ availableTo: { $exists: false } }, { availableTo: null }, { availableTo: { $gte: now } }],
      },
    ];

    // Apply other filters
    if (categoryId) {
      query.categories = new Types.ObjectId(categoryId);
    }

    if (brandId) {
      query.brandId = new Types.ObjectId(brandId);
    }

    if (minPrice && maxPrice) {
      query['variants.price'] = {};
      if (minPrice !== undefined) {
        query['variants.price'].$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        query['variants.price'].$lte = maxPrice;
      }
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (search) {
      // Add search to the existing $and array
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { brandName: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ],
      });
    }

    // Prepare sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    console.log(JSON.stringify(query))

    const [items, total] = await Promise.all([
      this.productModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .populate('categories', 'name slug')
        .populate('primaryCategoryId', 'name slug')
        .populate('brandId', 'name slug'),
      this.productModel.countDocuments(query),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(idOrSlug: string) {
    const query: any = { isActive: true };

    // Check if the provided string is a valid MongoDB ObjectId
    if (isValidObjectId(idOrSlug)) {
      query._id = idOrSlug;
    } else {
      query.slug = idOrSlug;
    }

    // Apply date-based availability filters
    const now = new Date();
    query.$or = [{ availableFrom: { $exists: false } }, { availableFrom: null }, { availableFrom: { $lte: now } }];

    query.$and = [
      {
        $or: [{ availableTo: { $exists: false } }, { availableTo: null }, { availableTo: { $gte: now } }],
      },
    ];

    const product = await this.productModel
      .findOne(query)
      .populate('categories', 'name slug')
      .populate('primaryCategoryId', 'name slug')
      .populate('brandId', 'name slug');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.productModel.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });

    return product;
  }

  async getFeaturedProducts(limit: number = 10) {
    const now = new Date();
    const query = {
      isActive: true,
      isFeatured: true,
      $or: [{ availableFrom: { $exists: false } }, { availableFrom: null }, { availableFrom: { $lte: now } }],
      $and: [
        {
          $or: [{ availableTo: { $exists: false } }, { availableTo: null }, { availableTo: { $gte: now } }],
        },
      ],
    };

    return this.productModel
      .find(query)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('primaryCategoryId', 'name slug')
      .populate('brandId', 'name slug');
  }

  async getBestSellerProducts(limit: number = 10) {
    const now = new Date();
    const query = {
      isActive: true,
      $or: [{ isBestSeller: true }, { totalSoldCount: { $gt: 0 } }],
      $and: [
        {
          $or: [{ availableFrom: { $exists: false } }, { availableFrom: null }, { availableFrom: { $lte: now } }],
        },
        {
          $or: [{ availableTo: { $exists: false } }, { availableTo: null }, { availableTo: { $gte: now } }],
        },
      ],
    };

    return this.productModel
      .find(query)
      .limit(limit)
      .sort({ totalSoldCount: -1, viewCount: -1 })
      .populate('primaryCategoryId', 'name slug')
      .populate('brandId', 'name slug');
  }

  async getNewArrivalProducts(limit: number = 10) {
    const now = new Date();
    const query = {
      isActive: true,
      isNewArrival: true,
      $or: [{ availableFrom: { $exists: false } }, { availableFrom: null }, { availableFrom: { $lte: now } }],
      $and: [
        {
          $or: [{ availableTo: { $exists: false } }, { availableTo: null }, { availableTo: { $gte: now } }],
        },
      ],
    };

    return this.productModel
      .find(query)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('primaryCategoryId', 'name slug')
      .populate('brandId', 'name slug');
  }

  async getOnSaleProducts(limit: number = 10) {
    const now = new Date();
    const query = {
      isActive: true,
      isOnSale: true,
      $or: [{ availableFrom: { $exists: false } }, { availableFrom: null }, { availableFrom: { $lte: now } }],
      $and: [
        {
          $or: [{ availableTo: { $exists: false } }, { availableTo: null }, { availableTo: { $gte: now } }],
        },
      ],
    };

    return this.productModel
      .find(query)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('primaryCategoryId', 'name slug')
      .populate('brandId', 'name slug');
  }

  async getRelatedProducts(productId: string, limit: number = 4) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const now = new Date();
    const query = {
      _id: { $ne: product._id },
      isActive: true,
      $or: [{ categories: { $in: product.categories } }, { brandId: product.brandId }, { tags: { $in: product.tags } }],
      $and: [
        {
          $or: [{ availableFrom: { $exists: false } }, { availableFrom: null }, { availableFrom: { $lte: now } }],
        },
        {
          $or: [{ availableTo: { $exists: false } }, { availableTo: null }, { availableTo: { $gte: now } }],
        },
      ],
    };

    return this.productModel
      .find(query)
      .limit(limit)
      .sort({ totalSoldCount: -1, viewCount: -1 })
      .populate('primaryCategoryId', 'name slug')
      .populate('brandId', 'name slug');
  }

  async incrementProductStats(id: string, statsDto: UpdateProductStatsDto) {
    const updateData: any = { $inc: {} };

    if (statsDto.viewCountIncrement) {
      updateData.$inc.viewCount = statsDto.viewCountIncrement;
    }

    if (statsDto.totalSoldCountIncrement) {
      updateData.$inc.totalSoldCount = statsDto.totalSoldCountIncrement;
    }

    if (statsDto.reviewCountIncrement) {
      updateData.$inc.reviewCount = statsDto.reviewCountIncrement;
    }

    if (statsDto.averageRating !== undefined) {
      updateData.$set = { averageRating: statsDto.averageRating };
    }

    if (Object.keys(updateData.$inc).length === 0 && !updateData.$set) {
      return this.findOne(id);
    }

    const updated = await this.productModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      throw new NotFoundException('Product not found');
    }

    return updated;
  }
}

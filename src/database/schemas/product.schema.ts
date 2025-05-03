import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import slugify from 'slugify';

export type ProductDocument = Product & Document;

// Define variant interface
interface ProductVariant {
  sku: string;
  name?: string;
  price: number;
  salePrice?: number;
  quantity: number;
  soldCount?: number;
  attributes?: Record<string, string>;
  images?: string[];
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, unique: true, lowercase: true })
  slug: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: String, default: 'simple' })
  type: 'simple' | 'variable';

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  categories: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  primaryCategoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Brand' })
  brandId: Types.ObjectId;


  @Prop({
    type: [{
      sku: { type: String, required: true },
      name: { type: String },
      price: { type: Number, required: true },
      salePrice: { type: Number },
      quantity: { type: Number, default: 0 },
      soldCount: { type: Number, default: 0 },
      attributes: { type: Object },
      images: { type: [String], default: [] }
    }],
    default: [{
      sku: '',
      price: 0,
      quantity: 0,
      soldCount: 0
    }]
  })
  variants: ProductVariant[];

  @Prop({ type: Number, default: 0 })
  viewCount: number;

  @Prop({ type: Number, default: 0 })
  totalSoldCount: number;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  averageRating: number;

  @Prop({ type: Number, default: 0 })
  reviewCount: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object, default: {} })
  specifications: Record<string, string>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isOnSale: boolean;

  @Prop({ default: false })
  isNewArrival: boolean;

  @Prop({ default: false })
  isBestSeller: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Add indexes for better query performance
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ name: 1 });
ProductSchema.index({ categories: 1 });
ProductSchema.index({ primaryCategoryId: 1 });
ProductSchema.index({ brandId: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isOnSale: 1 });
ProductSchema.index({ isNewArrival: 1 });
ProductSchema.index({ isBestSeller: 1 });
ProductSchema.index({ totalSoldCount: -1 });
ProductSchema.index({ viewCount: -1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ 'variants.price': 1 });
ProductSchema.index({ 'variants.sku': 1 });
ProductSchema.index({ 'variants.soldCount': -1 });

// Pre-save middleware to generate slug and validate prices
ProductSchema.pre('save', async function(next) {
  // Generate slug if name is modified
  if (this.isModified('name')) {
    this.slug = await generateUniqueSlug(this.constructor as Model<ProductDocument>, this.name, this._id.toString());
  }
  
  // Validate prices in variants
  if (this.variants && Array.isArray(this.variants)) {
    for (const variant of this.variants) {
      // Ensure price is a valid number
      if (variant.price === undefined || variant.price === null || isNaN(Number(variant.price))) {
        return next(new Error(`Invalid price value in variant: ${variant.sku || ''}`));
      }
      
      // Convert price to number if it's a string
      if (typeof variant.price === 'string') {
        variant.price = Number(variant.price);
      }
      
      // Ensure salePrice is a valid number if provided
      if (variant.salePrice !== undefined && variant.salePrice !== null) {
        if (isNaN(Number(variant.salePrice))) {
          return next(new Error(`Invalid sale price value in variant: ${variant.sku || ''}`));
        }
        
        // Convert salePrice to number if it's a string
        if (typeof variant.salePrice === 'string') {
          variant.salePrice = Number(variant.salePrice);
        }
      }
      
      // Ensure quantity is a valid number
      if (variant.quantity === undefined || variant.quantity === null || isNaN(Number(variant.quantity))) {
        return next(new Error(`Invalid quantity value in variant: ${variant.sku || ''}`));
      }
      
      // Convert quantity to number if it's a string
      if (typeof variant.quantity === 'string') {
        variant.quantity = Number(variant.quantity);
      }
    }
  }
  
  next();
});

// Pre-update middleware to generate slug
ProductSchema.pre(['updateOne', 'findOneAndUpdate'], async function(next) {
  const update = this.getUpdate() as any;
  if (update.name || update.$set?.name) {
    const name = update.name || update.$set.name;
    const docId = (this.getQuery()._id as Types.ObjectId).toString();
    if (!update.$set) update.$set = {};
    update.$set.slug = await generateUniqueSlug(this.model, name, docId);
  }
  next();
});

// Helper function to generate unique slug
async function generateUniqueSlug(
  model: Model<ProductDocument>,
  name: string,
  excludeId?: string,
): Promise<string> {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
    locale: 'vi',
  });

  const query = excludeId 
    ? { slug: baseSlug, _id: { $ne: new Types.ObjectId(excludeId) } }
    : { slug: baseSlug };
  
  const existingWithSlug = await model.findOne(query);
  
  if (!existingWithSlug) {
    return baseSlug;
  }

  // If slug exists, add a counter until we find an available slug
  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;
  
  while (await model.findOne(
    excludeId 
      ? { slug: newSlug, _id: { $ne: new Types.ObjectId(excludeId) } }
      : { slug: newSlug }
  )) {
    counter += 1;
    newSlug = `${baseSlug}-${counter}`;
  }
  
  return newSlug;
}


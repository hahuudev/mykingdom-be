import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Product, ProductSchema } from '@/database/schemas/product.schema';
import { ProductAdminController } from './controllers/admin/product-admin.controller';
import { ProductClientController } from './controllers/client/product-client.controller';
import { ProductAdminService } from './services/product-admin.service';
import { ProductClientService } from './services/product-client.service';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])
  ],
  controllers: [ProductAdminController, ProductClientController],
  providers: [ProductAdminService, ProductClientService],
  exports: [ProductAdminService, ProductClientService],
})
export class ProductModule {}
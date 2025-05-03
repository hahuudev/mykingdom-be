import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductClientService } from '../../services/product-client.service';
import { UpdateProductStatsDto } from '../../dto/update-product-stats.dto';

@ApiTags('Products')
@Controller('products')
export class ProductClientController {
  constructor(private readonly productClientService: ProductClientService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('tags') tags?: string[],
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    console.log('ssssssssssssssssssssssssssss')
    return this.productClientService.findAll({
      page,
      limit,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      tags,
      sortBy,
      sortOrder,
    });
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFeatured(@Query('limit') limit: number = 10) {
    return this.productClientService.getFeaturedProducts(limit);
  }

  @Get('best-sellers')
  @ApiOperation({ summary: 'Get best seller products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getBestSellers(@Query('limit') limit: number = 10) {
    return this.productClientService.getBestSellerProducts(limit);
  }

  @Get('new-arrivals')
  @ApiOperation({ summary: 'Get new arrival products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getNewArrivals(@Query('limit') limit: number = 10) {
    return this.productClientService.getNewArrivalProducts(limit);
  }

  @Get('on-sale')
  @ApiOperation({ summary: 'Get on sale products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getOnSale(@Query('limit') limit: number = 10) {
    return this.productClientService.getOnSaleProducts(limit);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get product by ID or slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.productClientService.findOne(idOrSlug);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRelated(
    @Param('id') id: string,
    @Query('limit') limit: number = 4,
  ) {
    return this.productClientService.getRelatedProducts(id, limit);
  }

  @Post(':id/stats')
  @ApiOperation({ summary: 'Update product statistics (client)' })
  updateStats(
    @Param('id') id: string,
    @Body() statsDto: UpdateProductStatsDto,
  ) {
    return this.productClientService.incrementProductStats(id, statsDto);
  }
}
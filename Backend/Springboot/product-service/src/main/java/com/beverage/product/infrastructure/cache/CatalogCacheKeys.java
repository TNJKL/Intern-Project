package com.beverage.product.infrastructure.cache;

import java.util.UUID;

/** Nơi duy nhất khai báo tên cache key cho catalog — tránh lệch giữa các use case. */
public final class CatalogCacheKeys {

    private CatalogCacheKeys() {}

    public static String productById(UUID id) {
        return "product:id:" + id;
    }

    public static String productBySlug(String slug) {
        return "product:slug:" + slug;
    }

    public static final String CATEGORIES_LIST = "categories:list";
    public static final String TOPPINGS_LIST   = "toppings:list";

    /** Pattern xóa hết cache product (id + slug) — dùng với deleteByPattern. */
    public static final String PRODUCT_ALL_PATTERN = "product:*";
}

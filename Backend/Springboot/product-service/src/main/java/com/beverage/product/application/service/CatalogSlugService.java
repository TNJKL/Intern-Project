package com.beverage.product.application.service;

import com.beverage.product.domain.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;
import java.util.regex.Pattern;

@Service
public class CatalogSlugService {

    private static final Pattern NON_SLUG = Pattern.compile("[^a-z0-9]+");
    private static final Pattern LEAD_TRAIL_DASH = Pattern.compile("(^-+)|(-+$)");

    /**
     * Slug kebab-case từ tên (ASCII hóa ký tự Latin có dấu).
     */
    public String slugify(String raw) {
        if (raw == null || raw.isBlank()) {
            return "item";
        }
        String n = Normalizer.normalize(raw.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        n = n.replace('đ', 'd').replace('Đ', 'd');
        n = n.toLowerCase(Locale.ROOT);
        n = NON_SLUG.matcher(n).replaceAll("-");
        n = LEAD_TRAIL_DASH.matcher(n).replaceAll("");
        if (n.isEmpty()) {
            return "item";
        }
        if (n.length() > 200) {
            n = n.substring(0, 200);
            n = LEAD_TRAIL_DASH.matcher(n.replaceAll("-+$", "")).replaceAll("");
            if (n.isEmpty()) {
                return "item";
            }
        }
        return n;
    }

    /**
     * Gán slug duy nhất trong phạm vi active: {@code base}, {@code base-1}, {@code base-2}, ...
     */
    public String allocateUniqueSlug(String baseName, Predicate<String> slugTakenInActiveCatalog) {
        String base = slugify(baseName);
        if (!slugTakenInActiveCatalog.test(base)) {
            return base;
        }
        for (int i = 1; i < 10_000; i++) {
            String candidate = base + "-" + i;
            if (!slugTakenInActiveCatalog.test(candidate)) {
                return candidate;
            }
        }
        throw new BusinessException("Không tạo được slug duy nhất sau nhiều lần thử.", "SLUG_EXHAUSTED");
    }
}

package com.beverage.inventory.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualRestoreRequest {

    @NotBlank(message = "Lý do hoàn kho không được để trống")
    private String note;
}

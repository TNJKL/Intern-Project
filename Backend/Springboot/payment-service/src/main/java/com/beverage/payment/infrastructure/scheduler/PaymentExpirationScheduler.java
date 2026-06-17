package com.beverage.payment.infrastructure.scheduler;

import com.beverage.payment.application.usecase.PaymentUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentExpirationScheduler {

    private final PaymentUseCase paymentUseCase;

    /**
     * Chạy định kỳ mỗi 1 phút (60000ms) để quét và đánh dấu hết hạn
     */
    @Scheduled(fixedDelayString = "${app.payment.expire-check-interval-ms:60000}")
    public void checkExpiredPayments() {
        log.debug("Scheduler running: Scanning for expired pending payments...");
        try {
            paymentUseCase.expirePendingPayments();
        } catch (Exception e) {
            log.error("Error occurred while processing expired payments", e);
        }
    }
}

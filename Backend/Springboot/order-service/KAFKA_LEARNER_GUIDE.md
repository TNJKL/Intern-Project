# Kafka Learner Guide

Hướng dẫn học Kafka trong 4 tiếng bằng cách nghịch code thực tế.

---

## Bước 0: Chuẩn bị

### Chạy service learner

```bash
# Tại folder order-service
mvn spring-boot:run -Dspring-boot.run.profiles=learner -Dspring-boot.run.arguments="--server.port=8085"
```

> Service chạy ở port **8085** (khác port 8083 của order-service chính)

### Tạo các topic

Mở terminal mới, chạy:

```bash
kafka-topics --create --topic learn.kafka.basic --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic learn.kafka.group --bootstrap-server localhost:9092 --partitions 4 --replication-factor 1
kafka-topics --create --topic learn.kafka.offset.earliest --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic learn.kafka.offset.latest --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic learn.kafka.multi-group --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic learn.kafka.retry --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic learn.kafka.retry.DLT --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic learn.kafka.idempotent --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic learn.kafka.deserialize --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```

### Gửi message (dùng Kafka CLI)

Mở terminal producer:

```bash
kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.basic
# Gõ message rồi Enter
```

Hoặc gửi nhiều message cùng lúc:

```bash
for i in {1..5}; do
  echo "Message $i" | kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.group
done
```

---

## LESSON 1: Consumer Group cơ bản

### File: `_01_BasicConsumer.java`

Consumer đơn giản nhất — lắng nghe topic, log message ra.

### Cách test

**Bước 1:** Gửi message vào topic:

```bash
kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.basic
> {"message": "Hello Kafka"}
> {"message": "Day la test"}
```

**Bước 2:** Quan sát log ở console của service:

```
INFO  === LESSON 1: BASIC CONSUMER ===
INFO  Topic    : learn.kafka.basic
INFO  Partition: 1
INFO  Offset   : 5
INFO  Key      : null
INFO  Value    : {"message": "Hello Kafka"}
INFO  Timestamp: 1716123456789
```

### Bài học

- `@KafkaListener` tự động subscribe topic
- Mỗi message mới được gọi vào method `consume()`
- `ConsumerRecord` chứa đầy đủ metadata: topic, partition, offset, key, value, timestamp

---

## LESSON 2: Consumer Group — Nhiều Instance

### File: `_02_ConsumerGroup.java`

### Cách test

**Bước 1:** Khởi động instance 1 (port 8085)

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=learner -Dspring-boot.run.arguments="--server.port=8085"
```

**Bước 2:** Khởi động instance 2 (port 8086) — MỞ TERMINAL MỚI

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=learner -Dspring-boot.run.arguments="--server.port=8086"
```

**Bước 3:** Gửi 4 message vào topic:

```bash
for i in {1..4}; do
  echo "Message $i" | kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.group
done
```

**Bước 4:** Quan sát log ở cả 2 terminal

### Kết quả mong đợi

```
# Terminal 1 (Instance 1):
INFO  === LESSON 2: CONSUMER GROUP ===
INFO  Instance : order-service-learner (PID=1234)
INFO  Partition: 0
INFO  Value    : Message 1

INFO  === LESSON 2: CONSUMER GROUP ===
INFO  Instance : order-service-learner (PID=1234)
INFO  Partition: 2
INFO  Value    : Message 3

# Terminal 2 (Instance 2):
INFO  === LESSON 2: CONSUMER GROUP ===
INFO  Instance : order-service-learner (PID=5678)
INFO  Partition: 1
INFO  Value    : Message 2

INFO  === LESSON 2: CONSUMER GROUP ===
INFO  Instance : order-service-learner (PID=5678)
INFO  Partition: 3
INFO  Value    : Message 4
```

### Bài học

- Kafka tự động chia partitions cho các consumer trong cùng group
- Mỗi partition chỉ do 1 consumer đọc (tránh trùng lặp)
- Thêm instance = Kafka tự rebalance partitions
- Nếu có 4 partitions và 2 instances → mỗi instance đọc 2 partitions
- Nếu có 4 partitions và 3 instances → 1 instance không có partition nào

---

## LESSON 3: Offset Reset — Earliest vs Latest

### File: `_03_OffsetReset.java`

Consumer không tự khởi động (`autoStartup = "false"`). Bật bằng tay qua API.

### Bước 1: Gửi message vào cả 2 topic

```bash
# Gửi 5 message vào earliest
for i in {1..5}; do
  echo "Earliest-msg-$i" | kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.offset.earliest
done

# Gửi 5 message vào latest
for i in {1..5}; do
  echo "Latest-msg-$i" | kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.offset.latest
done
```

### Bước 2: Bật consumer EARLIEST

```bash
curl -X POST http://localhost:8085/api/learn/kafka/offset/start-earliest
```

**Kết quả:** Log ngay 5 message cũ!

```
INFO  === EARLIEST ===
INFO  Value    : Earliest-msg-1
INFO  >>> ĐỌC MESSAGE CŨ (earliest)
```

### Bước 3: Bật consumer LATEST

```bash
curl -X POST http://localhost:8085/api/learn/kafka/offset/start-latest
```

**Kết quả:** KHÔNG log gì (vì 5 message đã có sẵn từ trước, không phải "message mới")

### Bước 4: Gửi thêm message mới

```bash
echo "New-latest-msg" | kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.offset.latest
```

**Kết quả:** LATEST chỉ nhận message này, không nhận 5 message cũ

### Bước 5: Restart consumer LATEST

```bash
curl -X POST http://localhost:8085/api/learn/kafka/offset/stop
curl -X POST http://localhost:8085/api/learn/kafka/offset/start-latest
```

**Kết quả:** LATEST KHÔNG đọc lại message cũ

### Bước 6: Restart consumer EARLIEST

```bash
curl -X POST http://localhost:8085/api/learn/kafka/offset/stop
curl -X POST http://localhost:8085/api/learn/kafka/offset/start-earliest
```

**Kết quả:** EARLIEST đọc lại TẤT CẢ 5 message cũ + message mới

### Bài học

| Mode      | Restart consumer | Đọc message cũ? |
|-----------|-----------------|----------------|
| earliest  | Có              | Có, tất cả     |
| latest    | Có              | Không          |

**Khi nào dùng:**
- **earliest**: billing, audit log, phân tích lịch sử (cần đọc lại)
- **latest**: thông báo real-time, xử lý order (chỉ cần message mới, mặc định)

---

## LESSON 4: Nhiều Consumer Group — Cùng Topic

### File: `_04_MultipleGroupIds.java`

### Cách test

```bash
kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.multi-group --property parse.key=true
> order-123:{"orderId": "123", "product": "Cà phê sữa"}
```

### Kết quả

```
# Terminal 1:
INFO  [NOTIFICATION SERVICE]
INFO  >>> Đang gửi email/SMS cho khách hàng...
INFO  OrderId : order-123
INFO  >>> Email/SMS đã gửi!

# Terminal 2:
INFO  [INVENTORY SERVICE]
INFO  >>> Đang trừ tồn kho...
INFO  OrderId : order-123
INFO  >>> Tồn kho đã được cập nhật!
```

### Bài học

- Mỗi consumer group có **offset riêng** cho cùng topic
- Gửi 1 message → **TẤT CẢ group** đều nhận được
- Trong thực tế:
  - `notification-service-group` → gửi email/SMS
  - `inventory-service-group` → trừ tồn kho
  - `payment-service-group` → xử lý thanh toán
- Mỗi service dùng group-id riêng → đều nhận đủ message cần xử lý

---

## LESSON 5: Retry và Dead Letter Queue (DLQ)

### File: `_05_RetryAndDLQ.java` và `LearnerKafkaConfig.java`

### Cách test

**Gửi message hợp lệ:**

```bash
echo '{"type": "ok", "data": "hello"}' | kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.retry
```

**Kết quả:**
```
INFO  === LESSON 5: RETRY & DLQ ===
INFO  Received: {"type": "ok", "data": "hello"}
INFO  >>> Xử lý OK - không retry
```

**Gửi message cố tình lỗi:**

```bash
echo '{"type": "error", "data": "fail"}' | kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.retry
```

**Kết quả:**
```
WARN  >>> [RETRY learn.kafka.retry] Lần 1 thất bại. Exception: Simulated processing failure!
WARN  >>> [RETRY learn.kafka.retry] Lần 2 thất bại. Exception: Simulated processing failure!
WARN  >>> [RETRY learn.kafka.retry] Lần 3 thất bại. Exception: Simulated processing failure!
ERROR !!! Gửi message lỗi sang DLQ. Topic: learn.kafka.retry, Partition: 1, Offset: 10
INFO  >>> DLQ topic: learn.kafka.retry.DLT
```

**Kiểm tra DLQ topic:**

```bash
kafka-console-consumer --bootstrap-server localhost:9092 --topic learn.kafka.retry.DLT --from-beginning
```

### Bài học

Flow xử lý lỗi:

```
Message → Consumer → LỖI
                     ↓
              Retry lần 1 (1s sau)
                     ↓
              Retry lần 2 (1s sau)
                     ↓
              Retry lần 3 (1s sau)
                     ↓
              Vẫn lỗi → Gửi sang DLQ topic
```

- `FixedBackOff(1000L, 3L)` = retry 3 lần, mỗi lần cách nhau 1 giây
- `DeadLetterPublishingRecoverer` = chuyển message lỗi sang topic `.DLT`
- Message không bị mất — vẫn nằm trong DLQ topic để debug/fix sau

---

## LESSON 6: Idempotent Consumer

### File: `_06_IdempotentConsumer.java`

### Vấn đề thực tế

Kafka retry khi producer không nhận được ACK:

```
Producer gửi message → Broker nhận ✓
Producer không nhận ACK (mạng lag)
Broker gửi lại message → Consumer nhận 2 LẦN!
→ Thanh toán 2 lần!
→ Gửi 2 email!
```

### Cách test

**Gửi cùng key 3 lần:**

```bash
kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.idempotent --property parse.key=true
> order-999:ORDER-999
> order-999:ORDER-999
> order-999:ORDER-999
```

**Kết quả:**
```
INFO  === LESSON 6: IDEMPOTENT CONSUMER ===
INFO  Received orderId: order-999
INFO  >>> Processing order order-999...
INFO  >>> [Thanh toán thành công]
INFO  >>> Order order-999 processed successfully

INFO  === LESSON 6: IDEMPOTENT CONSUMER ===
INFO  Received orderId: order-999
INFO  >>> Order order-999 ĐÃ xử lý trước đó - BỎ QUA (idempotent)
INFO  >>> Đây là cách tránh xử lý trùng!

INFO  === LESSON 6: IDEMPOTENT CONSUMER ===
INFO  Received orderId: order-999
INFO  >>> Order order-999 ĐÃ xử lý trước đó - BỎ QUA (idempotent)
```

**Kiểm tra số order đã xử lý:**

```bash
curl http://localhost:8085/api/learn/kafka/idempotent/count
# Output: "📊 Đã xử lý 1 orderId unique"
```

### Bài học

```java
// BƯỚC 1: Check đã xử lý chưa?
if (processedOrderIds.contains(orderId)) {
    return; // BỎ QUA
}

// BƯỚC 2: Xử lý
processOrder(orderId);

// BƯỚC 3: Đánh dấu
processedOrderIds.add(orderId);
```

**Trong thực tế:** Lưu `processedOrderIds` vào DB thay vì memory, vì:
- Restart service → memory mất
- Nhiều instance → mỗi instance có Set riêng

---

## LESSON 7: Deserialization Error

### File: `_07_DeserializationError.java`

### Vấn đề

Message không parse được JSON → Kafka không biết làm gì → Consumer **dừng hẳn**

### Cách test

**Gửi message đúng format:**

```bash
echo '{"orderId": "123", "status": "CONFIRMED"}' | kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.deserialize
```

**Kết quả:**
```
INFO  === LESSON 7: DESERIALIZATION ===
INFO  Raw message: {"orderId": "123", "status": "CONFIRMED"}
INFO  >>> Message parse THÀNH CÔNG
INFO  >>> Xử lý order bình thường
```

**Gửi message SAI format (bằng tay):**

```bash
kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.deserialize
> THIS IS NOT JSON AT ALL!!!
```

**Kết quả:**
```
INFO  === LESSON 7: DESERIALIZATION ===
INFO  Raw message: THIS IS NOT JSON AT ALL!!!
ERROR !!! DESERIALIZATION ERROR - cannot parse message: THIS IS NOT JSON AT ALL!!!
INFO  >>> Message bị SKIP, consumer tiếp tục hoạt động
```

**Gửi tiếp message đúng:**

```bash
echo '{"orderId": "456", "status": "PREPARING"}' | kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.deserialize
```

**Kết quả:** Vẫn xử lý được!

### Bài học

- `try/catch` trong consumer → message lỗi không crash consumer
- CATCH nhưng KHÔNG throw → Kafka coi như xử lý thành công (commit offset)
- Đừng throw exception → consumer dừng, tất cả message phía sau không được xử lý

---

## Tổng kết: 7 Bài học Kafka

| # | Bài | Khái niệm | Thực tế |
|---|-----|-----------|---------|
| 1 | Basic Consumer | KafkaListener | Tất cả service |
| 2 | Consumer Group | Partition chia cho nhiều instance | Scale order-service |
| 3 | Offset Reset | earliest vs latest | Billing vs real-time |
| 4 | Multiple Group IDs | Mỗi group có offset riêng | Notification + Inventory |
| 5 | Retry + DLQ | ErrorHandler + DeadLetterTopic | Xử lý lỗi graceful |
| 6 | Idempotent | Check trùng trước khi xử lý | Tránh thanh toán 2 lần |
| 7 | Deserialization Error | Try/catch trong consumer | Không crash khi message lỗi |

---

## Chạy service chính + learner cùng lúc

```bash
# Terminal 1: Order service chính (profile mặc định, port 8083)
mvn spring-boot:run

# Terminal 2: Learner (port 8085)
mvn spring-boot:run -Dspring-boot.run.profiles=learner -Dspring-boot.run.arguments="--server.port=8085"
```

---

## Xem status consumer

```bash
curl http://localhost:8085/api/learn/kafka/status
```

Output:

```
=== KAFKA LEARNER STATUS ===

Listener: learn-group-01
  Status : 🟢 RUNNING

Listener: learn-group-02
  Status : 🟢 RUNNING

Listener: learn-group-03-earliest
  Status : 🔴 STOPPED
```

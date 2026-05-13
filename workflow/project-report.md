# Báo Cáo Nền Móng Dự Án DebackX Image Translation

Ngày lập: 13/05/2026

## 1. Bối cảnh và bài toán

Dự án hướng tới xây dựng một web app dịch ảnh, trong đó tính năng chính là nhận ảnh từ người dùng, xử lý bằng mô hình AI DebackX và trả lại ảnh đã được dịch nội dung trong ảnh sang tiếng Việt.

Vấn đề kỹ thuật cốt lõi là các mô hình AI xử lý ảnh thường tiêu tốn nhiều tài nguyên và có thời gian suy luận dài. Nếu đặt toàn bộ quá trình upload, inference và trả kết quả trong một request HTTP đồng bộ, backend web có thể bị treo, request timeout, tài nguyên bị giữ lâu và trải nghiệm người dùng kém.

Vì vậy nền móng hiện tại được xây theo kiến trúc bất đồng bộ với các service chạy bằng Docker Compose local và database đặt trên MongoDB Atlas:

- Frontend chỉ chịu trách nhiệm tương tác người dùng.
- Node.js Gateway chịu trách nhiệm giao tiếp web, upload, trạng thái job và realtime notification.
- Python Worker chịu trách nhiệm xử lý AI.
- RabbitMQ điều phối hàng đợi job.
- MongoDB Atlas lưu trạng thái job.
- Docker Shared Volume lưu ảnh gốc và ảnh kết quả, tránh truyền ảnh lớn qua message broker.

## 2. Mục tiêu của phần nền móng đã xây dựng

Phần nền móng không nhằm hoàn thiện toàn bộ sản phẩm cuối, mà tạo ra một khung dự án có thể mở rộng an toàn. Các mục tiêu chính:

- Tách tầng giao tiếp khỏi tầng tính toán AI.
- Biến xử lý ảnh thành job bất đồng bộ.
- Tổ chức source code theo feature để dễ thêm tính năng.
- Có Docker Compose để dựng các service local và kết nối tới MongoDB Atlas.
- Có contract rõ ràng giữa Gateway và Worker.
- Có điểm cắm riêng cho DebackX thật trong worker.
- Có frontend tối thiểu để upload ảnh, theo dõi trạng thái và xem kết quả.

## 3. Những thành phần đã triển khai

### 3.1 Docker Compose

File `docker-compose.yml` đã định nghĩa các service chính và cấu hình kết nối cloud:

- `web`: React/Vite frontend.
- `gateway`: Node.js/Express API gateway.
- `worker`: Python/FastAPI worker.
- `rabbitmq`: message broker, kèm management console.
- `MONGO_URL`: connection string tới MongoDB Atlas để lưu trạng thái job.
- `uploads`: shared volume dùng chung giữa Gateway và Worker.

Luồng dữ liệu ảnh được tối ưu bằng shared volume. Gateway lưu ảnh vào `/app/uploads`, Worker đọc trực tiếp file đó và ghi ảnh kết quả lại cùng volume. RabbitMQ chỉ truyền metadata như `jobId`, `inputFile`, `outputFile`, không truyền binary image.

### 3.2 Frontend Web App

Frontend nằm tại `apps/web`.

Cấu trúc đã chuyển sang hướng feature-based:

```text
apps/web/src/
  app/
    App.jsx
    styles.css
  features/
    image-translation/
      api/
      components/
      hooks/
  shared/
    config/
    ui/
```

Các phần đã có:

- UI upload ảnh.
- Preview ảnh gốc trước khi gửi.
- Gửi multipart request tới Gateway.
- Theo dõi trạng thái job qua Socket.IO.
- Hiển thị ảnh kết quả khi job hoàn tất.
- Tách API client riêng tại `features/image-translation/api`.
- Tách realtime state hook tại `features/image-translation/hooks`.

Feature chính hiện tại là `image-translation`. Sau này nếu thêm tính năng như lịch sử dịch ảnh, batch translation hoặc editor so sánh trước/sau, có thể tạo thêm component/hook/API trong cùng feature hoặc thêm feature mới.

### 3.3 Node.js Gateway

Gateway nằm tại `services/gateway`.

Cấu trúc hiện tại:

```text
services/gateway/src/
  config/
  infrastructure/
    database/
    messaging/
    storage/
  modules/
    image-translation/
  index.js
```

Các phần đã triển khai:

- Express server.
- CORS config cho frontend.
- Health endpoint: `GET /api/health`.
- Upload ảnh bằng `multer`.
- Lưu file ảnh gốc vào shared volume.
- Lưu trạng thái job vào MongoDB.
- Publish job vào RabbitMQ.
- Consume completion message từ RabbitMQ.
- Cập nhật trạng thái job khi Worker xử lý xong.
- Emit realtime update về frontend bằng Socket.IO.

Module `image-translation` được tách riêng gồm:

- `imageTranslation.routes.js`: API route cho job dịch ảnh.
- `imageTranslation.repository.js`: thao tác MongoDB cho image translation job.
- `imageTranslation.serializer.js`: định dạng response trả về frontend.
- `imageTranslation.completions.js`: xử lý completion message từ Worker.
- `index.js`: lắp ráp module.

API chính hiện tại:

- `POST /api/image-translations/jobs`
- `GET /api/image-translations/jobs/:jobId`
- `GET /api/image-translations/jobs/:jobId/result`

Socket.IO event chính:

- Client emit: `image-translation:join-job`
- Server emit: `image-translation:job-update`

### 3.4 Python Worker

Worker nằm tại `services/worker`.

Cấu trúc hiện tại:

```text
services/worker/app/
  core/
  infrastructure/
    messaging/
  modules/
    image_translation/
  main.py
```

Các phần đã triển khai:

- FastAPI app để cung cấp healthcheck.
- Worker thread chạy song song với FastAPI app.
- RabbitMQ consumer nhận job dịch ảnh.
- Processor xử lý job theo contract từ Gateway.
- Pipeline placeholder bằng Pillow.
- Publish completion message về RabbitMQ.

Điểm cắm DebackX thật nằm tại:

```text
services/worker/app/modules/image_translation/pipeline.py
```

Hiện pipeline chỉ dùng Pillow để tạo ảnh output placeholder. Khi tích hợp DebackX thật, cần thay nội dung hàm `run_debackx_placeholder(input_path, output_path)` bằng inference thực tế, giữ nguyên đầu vào là đường dẫn ảnh gốc và đầu ra là đường dẫn ảnh kết quả.

### 3.5 Message Contract

Gateway publish job vào queue `image.translate.requested`:

```json
{
  "jobId": "uuid",
  "inputFile": "uuid.png",
  "outputFile": "uuid.vi.png",
  "requestedAt": "2026-05-13T00:00:00.000Z"
}
```

Worker publish kết quả vào queue `image.translate.completed`:

```json
{
  "jobId": "uuid",
  "ok": true,
  "outputFile": "uuid.vi.png",
  "durationMs": 1200,
  "worker": "debackx-worker-1"
}
```

Contract này giúp Gateway và Worker phát triển độc lập. Worker không cần biết HTTP request đến từ đâu, Gateway không cần biết nội bộ DebackX xử lý như thế nào.

## 4. Luồng xử lý hiện tại

1. Người dùng chọn ảnh trên Web UI.
2. Frontend gửi ảnh đến Gateway bằng `POST /api/image-translations/jobs`.
3. Gateway lưu ảnh vào shared volume.
4. Gateway tạo job record trong MongoDB với trạng thái `queued`.
5. Gateway publish message vào RabbitMQ.
6. Worker consume message từ RabbitMQ.
7. Worker đọc ảnh gốc từ shared volume.
8. Worker chạy pipeline xử lý ảnh.
9. Worker ghi ảnh kết quả vào shared volume.
10. Worker publish completion message về RabbitMQ.
11. Gateway consume completion message.
12. Gateway cập nhật trạng thái job trong MongoDB thành `completed` hoặc `failed`.
13. Gateway emit Socket.IO event cho frontend.
14. Frontend cập nhật UI và tải ảnh kết quả từ Gateway.

## 5. Lý do chọn kiến trúc này

### 5.1 Tránh blocking request

Inference AI không nằm trong HTTP request. Request upload chỉ cần lưu file, tạo job và trả `202 Accepted`. Người dùng không phải chờ model chạy xong trong cùng request.

### 5.2 Tách trách nhiệm rõ ràng

Node.js phù hợp làm gateway giao tiếp web, upload, realtime notification. Python phù hợp chạy AI model vì hệ sinh thái inference và xử lý ảnh mạnh hơn.

### 5.3 Dễ scale worker

Vì job đi qua RabbitMQ, có thể tăng số lượng Python Worker mà không phải đổi frontend hoặc Gateway. Nhiều worker có thể cùng consume từ một queue.

### 5.4 Tránh truyền ảnh lớn qua queue

RabbitMQ chỉ nên truyền metadata nhỏ. File ảnh nằm trong shared volume. Cách này giảm overhead encode/decode, giảm tải broker và đơn giản hóa worker.

### 5.5 Dễ mở rộng tính năng

Cấu trúc feature-based giúp tránh tình trạng mọi logic dồn vào một file. Khi thêm tính năng, có thể tạo module mới thay vì sửa lan rộng.

## 6. Cách phát triển dự án từ nền này

### Giai đoạn 1: Làm chắc nền tảng hiện tại

Mục tiêu là biến scaffold thành một luồng ổn định, dễ debug.

Việc nên làm:

- Chạy được `docker compose up --build` trên máy có quyền Docker.
- Kiểm tra upload ảnh thật từ UI.
- Kiểm tra RabbitMQ message đi qua đúng queue.
- Kiểm tra MongoDB lưu đúng trạng thái job.
- Thêm trạng thái job chi tiết hơn: `queued`, `processing`, `completed`, `failed`.
- Khi Worker bắt đầu xử lý, publish hoặc cập nhật trạng thái `processing`.
- Chuẩn hóa error response của Gateway.
- Giới hạn định dạng ảnh được upload: PNG, JPG, WEBP.
- Giới hạn kích thước file theo cấu hình.
- Thêm logging có `jobId` để trace xuyên suốt Gateway và Worker.

### Giai đoạn 2: Tích hợp DebackX thật

Mục tiêu là thay placeholder bằng pipeline inference thực tế.

Việc nên làm:

- Cập nhật `services/worker/requirements.txt` theo dependency của DebackX.
- Nếu cần GPU, đổi Dockerfile worker sang base image có CUDA phù hợp.
- Load model một lần khi Worker startup, không load lại cho mỗi job.
- Tạo interface rõ ràng trong `pipeline.py`, ví dụ `translate_image(input_path, output_path, options)`.
- Ghi lại thời gian xử lý từng bước: load image, preprocess, inference, postprocess, save output.
- Thêm config cho ngôn ngữ nguồn/đích nếu DebackX hỗ trợ.
- Thêm cơ chế fallback khi model lỗi để job không bị kẹt.

### Giai đoạn 3: Hoàn thiện trải nghiệm người dùng

Mục tiêu là biến UI tối thiểu thành web app dịch ảnh dễ dùng.

Tính năng nên thêm:

- Màn hình lịch sử các ảnh đã dịch.
- So sánh ảnh gốc và ảnh kết quả.
- Nút tải ảnh kết quả.
- Trạng thái realtime rõ hơn: đang chờ, đang xử lý, hoàn tất, thất bại.
- Progress indicator nếu pipeline có thể báo tiến độ.
- Batch upload nhiều ảnh.
- Kéo thả file vào vùng upload.
- Hiển thị metadata: kích thước ảnh, thời gian xử lý, worker xử lý.
- Cho phép người dùng chọn ngôn ngữ đích nếu sau này hỗ trợ nhiều ngôn ngữ.

### Giai đoạn 4: Hoàn thiện dữ liệu và quản lý job

Mục tiêu là quản lý job lâu dài, không chỉ xử lý một lần.

Việc nên làm:

- Mở rộng schema MongoDB:
  - `jobId`
  - `status`
  - `originalName`
  - `inputFile`
  - `outputFile`
  - `sourceLanguage`
  - `targetLanguage`
  - `durationMs`
  - `worker`
  - `error`
  - `createdAt`
  - `updatedAt`
  - `completedAt`
- Thêm API list jobs: `GET /api/image-translations/jobs`.
- Thêm phân trang và filter theo trạng thái.
- Thêm chính sách xóa file cũ.
- Thêm thumbnail để UI lịch sử tải nhanh hơn.

### Giai đoạn 5: Tăng độ tin cậy của hàng đợi

Mục tiêu là tránh mất job và xử lý tốt khi Worker lỗi.

Việc nên làm:

- Thêm retry policy cho job thất bại tạm thời.
- Thêm dead-letter queue cho job lỗi nhiều lần.
- Thêm `attemptCount` vào message hoặc database.
- Đảm bảo Worker ack message chỉ sau khi ghi output thành công.
- Thêm timeout xử lý job.
- Thêm endpoint hoặc script để requeue job failed.
- Tách queue theo độ ưu tiên nếu sau này có user trả phí hoặc batch lớn.

### Giai đoạn 6: Chuẩn bị production

Mục tiêu là đưa từ local distributed architecture lên môi trường thật.

Việc nên làm:

- Thay Docker shared volume bằng object storage nếu chạy nhiều máy, ví dụ S3 hoặc MinIO.
- Thêm authentication nếu có tài khoản người dùng.
- Gắn job với userId.
- Thêm rate limit cho upload.
- Thêm antivirus hoặc kiểm tra file nếu public upload.
- Thêm observability:
  - structured logs
  - metrics
  - tracing theo `jobId`
  - dashboard RabbitMQ
  - healthcheck chi tiết
- Thêm CI/CD:
  - lint frontend
  - test gateway
  - test worker
  - build Docker images
- Tách secret ra khỏi compose bằng `.env` hoặc secret manager.

## 7. Quy ước khi thêm tính năng mới

Khi thêm tính năng frontend:

```text
apps/web/src/features/<feature-name>/
  api/
  components/
  hooks/
```

Khi thêm module backend Gateway:

```text
services/gateway/src/modules/<module-name>/
  <module>.routes.js
  <module>.repository.js
  <module>.serializer.js
  index.js
```

Khi thêm module Worker:

```text
services/worker/app/modules/<module_name>/
  processor.py
  pipeline.py
```

Các phần dùng chung đặt trong `infrastructure`, `core`, `shared` hoặc `config`, không đặt lẫn vào feature.

## 8. Hạn chế hiện tại

Nền móng hiện tại vẫn còn một số giới hạn:

- Chưa tích hợp DebackX thật, mới có placeholder bằng Pillow.
- Chưa có trạng thái `processing`.
- Chưa có API list/history job.
- Chưa có retry/dead-letter queue.
- Chưa có authentication.
- Chưa có test tự động.
- Chưa có object storage cho môi trường nhiều máy.
- Chưa có logging/metrics đầy đủ.

Đây là các điểm nên xử lý theo từng giai đoạn, không cần làm tất cả cùng lúc.

## 9. Thứ tự ưu tiên đề xuất

Thứ tự phát triển hợp lý:

1. Chạy end-to-end bằng Docker Compose và xác nhận luồng upload -> queue -> worker -> result.
2. Thêm trạng thái `processing` và logging theo `jobId`.
3. Tích hợp DebackX thật vào `pipeline.py`.
4. Làm UI tải kết quả, lịch sử job và so sánh ảnh gốc/kết quả.
5. Thêm retry/dead-letter queue.
6. Thêm API list jobs và schema metadata đầy đủ.
7. Thêm test tự động cho Gateway và Worker.
8. Chuẩn bị production: auth, object storage, observability, CI/CD.

## 10. Kết luận

Nền móng hiện tại đã chuyển bài toán dịch ảnh từ một luồng xử lý đồng bộ dễ nghẽn sang kiến trúc bất đồng bộ, tách biệt rõ tầng giao tiếp và tầng AI. Đây là nền phù hợp để phát triển một web app dịch ảnh thực tế vì có thể mở rộng cả về tính năng lẫn năng lực xử lý.

Phần quan trọng nhất cần giữ khi phát triển tiếp là ranh giới trách nhiệm:

- Frontend không biết chi tiết AI model.
- Gateway không chạy inference.
- Worker không xử lý HTTP upload.
- RabbitMQ chỉ điều phối metadata.
- Shared storage hoặc object storage chịu trách nhiệm lưu file ảnh.

Nếu giữ được ranh giới này, dự án có thể phát triển thêm nhiều tính năng mà không làm hỏng lõi dịch ảnh chính.

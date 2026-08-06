# Thiết kế API hoàn chỉnh — Music App

Tài liệu bám theo backend Express + Mongoose hiện tại. Route đã có được giữ
nguyên để không làm hỏng client. Route mới tiếp tục dùng base URL:

```text
/api/v1
```

## 0. Route map

Ký hiệu: `Public` không cần access token, `User` cần Bearer token, `Owner`
cần Bearer token và phải sở hữu resource, `Admin` cần role `admin`.

| Nhóm | Method | Path | Quyền | Trạng thái |
| --- | --- | --- | --- | --- |
| Auth | POST | `/auth/register` | Public | Đã có |
| Auth | POST | `/auth/login` | Public | Đã có |
| Auth | POST | `/auth/forgot-password` | Public | Đã có |
| Auth | POST | `/auth/reset-password` | Public | Đã có |
| Auth | POST | `/auth/refresh-token` | Cookie | Đã có |
| Auth | POST | `/auth/logout` | Cookie | Đã có |
| Auth | DELETE | `/auth/sessions` | User | Đã có |
| User | GET, PATCH | `/user/me` | User | Đã có |
| User | PATCH | `/user/me/password` | User | Cần làm |
| User | DELETE | `/user/me` | User | Cần làm |
| User | GET | `/user/me/likes` | User | Cần làm |
| User | GET | `/user/me/playlists` | User | Cần làm |
| User | GET, DELETE | `/user/me/history` | User | Cần làm |
| User | GET | `/user/:userId` | Public | Cần làm |
| User | GET | `/user/:userId/tracks` | Public | Cần làm |
| User | GET, POST, DELETE | `/user/:userId/follow` | User | Cần làm |
| User | GET | `/user/:userId/followers`, `/following` | Public | Cần làm |
| Tracks | GET, POST | `/tracks` | Public / User | Đã có |
| Tracks | GET, PATCH, DELETE | `/tracks/:trackId` | Public / Owner | Đã có |
| Tracks | GET | `/tracks/:trackId/stream` | Public | Đã có |
| Tracks | POST | `/tracks/:trackId/plays` | Public | Đã có |
| Likes | GET, POST, DELETE | `/tracks/:trackId/like` | User | GET cần làm |
| Comments | GET, POST | `/tracks/:trackId/comment` | Public / User | Đã có |
| Comments | PATCH, DELETE | `/tracks/:trackId/comment/:commentId` | Owner | Cần làm |
| Playlists | CRUD | `/playlists[/:playlistId]` | User / Owner | Cần làm |
| Playlists | POST, DELETE, PATCH | `/playlists/:playlistId/tracks[...]` | Owner | Cần làm |
| Search | GET | `/search` | Public | Cần làm |
| Genres | GET | `/genres` | Public | Cần làm |

Đây là route map cho MVP. Podcast, notification, chart theo thời gian và admin
ở các phần sau là module mở rộng, không phải dependency để ra mắt bản đầu.

Nhãn **đã có** nghĩa là route/controller đã tồn tại trong codebase. Input,
output và status code bên dưới là **contract mục tiêu**; các route hiện có vẫn
cần được chuẩn hóa nếu hành vi hiện tại khác contract (ví dụ tạo track hiện trả
`200`, còn contract mục tiêu trả `201`).

## 1. Quy ước chung

### Xác thực

Route ghi `Bearer` yêu cầu:

```http
Authorization: Bearer <access-token>
```

Refresh token nằm trong HTTP-only cookie `refreshToken`, path
`/api/v1/auth`. Access token không lưu trong cookie.

### Response

Một resource:

```json
{
  "message": "Thành công",
  "data": {}
}
```

Danh sách:

```json
{
  "message": "Thành công",
  "data": [],
  "pagination": {
    "currentPage": 1,
    "limit": 20,
    "totalCount": 0,
    "totalPages": 0
  }
}
```

Lỗi validation:

```json
{
  "message": "Dữ liệu không hợp lệ",
  "errors": {
    "field": "Mô tả lỗi"
  }
}
```

Mã HTTP dùng thống nhất:

| Code | Ý nghĩa |
| --- | --- |
| `200` | Đọc/cập nhật thành công |
| `201` | Tạo resource thành công |
| `204` | Xóa thành công, không có body |
| `400` | Input hoặc ObjectId không hợp lệ |
| `401` | Chưa đăng nhập/token hết hạn |
| `403` | Đã đăng nhập nhưng không có quyền |
| `404` | Không tìm thấy resource |
| `409` | Email, like, follow hoặc dữ liệu unique bị trùng |
| `413` | File vượt giới hạn |
| `500` | Lỗi server, không trả stack trace cho client |

### Query chung

- `page`: integer, mặc định `1`, nhỏ nhất `1`.
- `limit`: integer, mặc định `20`, từ `1` đến `100`.
- ID phải được kiểm tra bằng `mongoose.isValidObjectId` trước khi query.
- Text input được `trim`; email và genre được chuyển lowercase.

## 2. Kiểu dữ liệu đầu ra

### UserPublic

```json
{
  "_id": "userId",
  "name": "Nguyễn Văn A",
  "avatar": "https://...",
  "createdAt": "2026-08-04T00:00:00.000Z"
}
```

### UserPrivate

```json
{
  "_id": "userId",
  "name": "Nguyễn Văn A",
  "avatar": "https://...",
  "email": "user@example.com",
  "role": "user",
  "createdAt": "2026-08-04T00:00:00.000Z"
}
```

Không bao giờ trả `password`, `deleted`, `deletedAt`.

### Track

Khớp `tracks.model.ts` hiện tại:

```json
{
  "_id": "trackId",
  "title": "Tên bài hát",
  "slug": "ten-bai-hat",
  "description": "Mô tả",
  "coverImageUrl": "https://...",
  "lyricsUrl": "https://...",
  "duration": 215.4,
  "genre": "pop",
  "artist": "userId",
  "playCount": 120,
  "likeCount": 15,
  "createdAt": "2026-08-04T00:00:00.000Z",
  "updatedAt": "2026-08-04T00:00:00.000Z"
}
```

Không trả `audioPublicId`, `coverImagePublicId`, `lyricsPublicId` cho client
công khai. URL nghe nhạc lấy qua route `/stream`.

### Comment

```json
{
  "_id": "commentId",
  "trackId": "trackId",
  "content": "Bài này hay",
  "parentId": null,
  "author": {
    "_id": "userId",
    "name": "Nguyễn Văn A",
    "avatar": "https://..."
  },
  "createdAt": "2026-08-04T00:00:00.000Z",
  "updatedAt": "2026-08-04T00:00:00.000Z"
}
```

### Playlist

Model mới tối thiểu:

```json
{
  "_id": "playlistId",
  "name": "Nhạc tập trung",
  "description": "",
  "coverImageUrl": "https://...",
  "visibility": "private",
  "owner": {
    "_id": "userId",
    "name": "Nguyễn Văn A",
    "avatar": "https://..."
  },
  "trackCount": 12,
  "createdAt": "2026-08-04T00:00:00.000Z",
  "updatedAt": "2026-08-04T00:00:00.000Z"
}
```

`visibility` chỉ nhận `public` hoặc `private`.

## 3. Auth — `/api/v1/auth`

### `POST /register` — đã có

Input JSON:

```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "minimum-8-characters"
}
```

Output `201`:

```json
{
  "message": "Tạo tài khoản thành công.",
  "data": {
    "user": {
      "_id": "userId",
      "name": "Nguyễn Văn A",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

Thực hiện:

1. Validate name/email/password; password dài `8..128`.
2. Chuẩn hóa email lowercase và kiểm tra unique.
3. Hash bằng bcrypt cost `12`, lưu User.
4. Không tự cấp quyền `role` từ body.

### `POST /login` — đã có

Input JSON:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Output `200` và set refresh-token cookie:

```json
{
  "message": "Đăng nhập thành công.",
  "accessToken": "jwt",
  "user": {
    "userId": "userId",
    "email": "user@example.com",
    "role": "user"
  }
}
```

Thực hiện: tìm user chưa bị xóa, so mật khẩu, tạo RefreshToken 7 ngày, tạo
access token và đặt cookie.

### `POST /forgot-password` — đã có

Input JSON:

```json
{ "email": "user@example.com" }
```

Output luôn là `200`, kể cả khi email không tồn tại, để tránh lộ danh sách tài
khoản:

```json
{ "message": "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi." }
```

Token ngẫu nhiên chỉ gửi qua email; database chỉ lưu SHA-256 hash và thời hạn
15 phút.

### `POST /reset-password` — đã có

Input JSON:

```json
{
  "token": "64-character-hex-token",
  "password": "new-password"
}
```

Output `200`. Sau khi đổi mật khẩu phải xóa toàn bộ refresh token của user và
buộc đăng nhập lại. Token sai hoặc hết hạn trả `400`.

### `POST /refresh-token` — đã có

Input: refresh-token cookie. Output `200` giống phần token của login.

Thực hiện: tìm token còn hạn, verify JWT, kiểm tra user hoạt động, rotate token
trong database và cookie, sau đó cấp access token mới.

### `POST /logout` — đã có

Input: refresh-token cookie. Output `200`:

```json
{ "message": "Đăng xuất thành công." }
```

Thực hiện: xóa token hiện tại nếu có và clear cookie.

### `DELETE /sessions` — đã có, Bearer

Output `204`. Thực hiện:

1. `RefreshToken.deleteMany({ userId: req.user.userId })`.
2. Clear refresh-token cookie của thiết bị hiện tại.

## 4. User — `/api/v1/user`

Các route `/me...` phải đặt trước `/:userId` trong `user.route.ts`.

### `GET /me` — đã có, Bearer

Input: không có. Output `200`: `UserPrivate`.

### `PATCH /me` — đã có, Bearer

Input `multipart/form-data`, ít nhất một field:

| Field | Loại | Giới hạn |
| --- | --- | --- |
| `name` | text | `1..100` ký tự sau trim |
| `avatar` | image | Một file, tối đa 5 MB |

Output `200`: `UserPrivate` đã cập nhật.

Thực hiện: validate trước upload, upload avatar mới, cập nhật user, sau khi DB
thành công mới xóa Cloudinary avatar cũ nếu có public ID. Model User cần thêm
`avatarPublicId` để cleanup đúng.

### `PATCH /me/password` — cần làm, Bearer

Input JSON:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

Output `200`:

```json
{ "message": "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." }
```

Thực hiện: select password, so mật khẩu hiện tại, validate mật khẩu mới, hash,
save và xóa mọi RefreshToken của user.

### `DELETE /me` — cần làm, Bearer

Input JSON để tránh xóa nhầm:

```json
{ "password": "current-password" }
```

Output `204`.

Thực hiện: xác nhận mật khẩu, đặt `deleted=true`, `deletedAt=now`, thu hồi mọi
refresh token và clear cookie bằng đúng options/path của auth controller. Nên
tách cấu hình refresh cookie thành helper dùng chung. Track vẫn được giữ; UI
hiển thị nghệ sĩ là “Tài khoản đã xóa”.

### `GET /me/likes` — cần làm, Bearer

Input query: `page`, `limit`. Output `200`: danh sách `Track`, sắp theo Like
`createdAt desc`.

Thực hiện: query Like theo user, phân trang, lấy các Track tương ứng và giữ
nguyên thứ tự của danh sách Like.

### `GET /me/playlists` — cần làm, Bearer

Input query: `page`, `limit`. Output `200`: playlist do user sở hữu, gồm cả
public và private.

### `GET /me/history` — cần làm, Bearer

Input query: `page`, `limit`. Output `200`:

```json
{
  "message": "Lấy lịch sử nghe thành công.",
  "data": [
    {
      "track": {},
      "lastPlayedAt": "2026-08-04T00:00:00.000Z",
      "playCount": 3
    }
  ],
  "pagination": {}
}
```

Model mới `PlayHistory`: `userId`, `trackId`, `lastPlayedAt`, `playCount`;
unique index `{ userId: 1, trackId: 1 }`.

### `DELETE /me/history` — cần làm, Bearer

Output `204`. Thực hiện: xóa toàn bộ PlayHistory của user.

### `GET /:userId` — cần làm, public

Output `200`: `UserPublic` cùng `trackCount`, `followerCount`,
`followingCount`. Chỉ lấy user `deleted=false`.

### `GET /:userId/tracks` — cần làm, public

Input query: `page`, `limit`, `sortKey=createdAt|playCount|likeCount`,
`sortValue=asc|desc`. Output: danh sách Track có `artist === userId`.

### `GET /:userId/follow` — cần làm, Bearer

Output `200`:

```json
{ "data": { "following": true } }
```

### `POST /:userId/follow` — cần làm, Bearer

Output `201`. Không cho follow chính mình. Model mới `Follow` gồm
`followerId`, `followingId`, timestamps và unique compound index.

### `DELETE /:userId/follow` — cần làm, Bearer

Output `204`. Chỉ thành công khi quan hệ follow tồn tại.

### `GET /:userId/followers` và `GET /:userId/following` — cần làm

Input query: `page`, `limit`. Output: danh sách `UserPublic`.

## 5. Tracks — `/api/v1/tracks`

### `GET /` — đã có

Input query:

| Query | Giá trị |
| --- | --- |
| `keyword` | Tìm theo title |
| `genre` | Lọc genre lowercase |
| `sortKey` | `createdAt`, `playCount`, `likeCount`, `title` |
| `sortValue` | `asc`, `desc`, `1` hoặc `-1` |
| `page`, `limit` | Phân trang |

Output `200`: danh sách Track. Thực hiện: whitelist `sortKey`, escape keyword
trước khi tạo RegExp, giới hạn `limit <= 100`, chỉ select field public.

Các màn hình tái sử dụng route này:

```http
# Home: mới phát hành
GET /tracks?sortKey=createdAt&sortValue=desc&limit=12

# Explore theo thể loại
GET /tracks?genre=pop&sortKey=createdAt&sortValue=desc

# Charts toàn thời gian
GET /tracks?sortKey=playCount&sortValue=desc&limit=100
```

### `POST /` — đã có, Bearer

Input `multipart/form-data`:

| Field | Loại | Bắt buộc | Giới hạn |
| --- | --- | :---: | --- |
| `title` | text | Có | `1..200` ký tự |
| `genre` | text | Có | Giá trị trong danh sách genre cho phép |
| `description` | text | Không | Tối đa `2000` ký tự |
| `audio` | audio file | Có | Một file, tối đa 50 MB |
| `avatar` | image file | Không | Một file, tối đa 5 MB |
| `lyrics` | txt/pdf | Không | Một file, tối đa 2 MB |

Output `201`: Track vừa tạo.

Thực hiện: auth → multer → validate MIME/size theo từng field → upload
Cloudinary → tạo Track với `artist=req.user.userId`. Nếu save thất bại, xóa
các asset vừa upload.

### `GET /:trackId` — đã có

Output `200`: Track public và `artist: UserPublic`. Không trả URL audio gốc.

### `PATCH /:trackId` — đã có, chủ track

Input giống create nhưng tất cả field tùy chọn và phải có ít nhất một thay đổi.
Output `200`: Track đã cập nhật.

Thực hiện: tìm track → kiểm tra owner → validate/upload file mới → cập nhật DB
→ xóa asset cũ. Không cho sửa `artist`, counter hoặc public ID qua body.

### `DELETE /:trackId` — đã có, chủ track

Output `204`. Thực hiện trong transaction nếu database hỗ trợ:

1. Kiểm tra owner.
2. Xóa Track, Like, Comment, PlayHistory và track khỏi mọi Playlist.
3. Sau khi DB thành công, xóa audio/cover/lyrics trên Cloudinary.

### `GET /:trackId/stream` — đã có

Output `200`:

```json
{
  "message": "Lấy stream track thành công.",
  "streamUrl": "https://...",
  "expiresAt": 1785800000
}
```

Thực hiện: tìm track, tạo authenticated Cloudinary URL có hạn 5 phút. Không
tăng lượt nghe ở route này.

### `POST /:trackId/plays` — đã có, auth tùy chọn

Input JSON tùy chọn:

```json
{ "sessionId": "client-generated-id" }
```

Output `200`:

```json
{ "data": { "trackId": "trackId", "playCount": 121 } }
```

Thực hiện: tăng `Track.playCount`. Nếu request có access token, upsert
PlayHistory và cập nhật `lastPlayedAt`. Chống spam chính xác cần collection
PlayEvent/Redis; MVP chỉ ghi một lần khi client đã nghe đủ 30 giây.

### `GET /:trackId/like` — cần làm, Bearer

Output `200`: `{ "data": { "liked": true } }`.

### `POST /:trackId/like` — đã có, Bearer

Output `201`: Like vừa tạo. Thực hiện: kiểm tra Track, tạo Like; unique index
`{ userId: 1, trackId: 1 }`; chỉ `$inc likeCount: 1` nếu Like được tạo.

### `DELETE /:trackId/like` — đã có, Bearer

Output `204`. Xóa Like theo user + track; chỉ `$inc likeCount: -1` nếu đã xóa
được document. Không để counter nhỏ hơn `0`.

## 6. Comments — nằm dưới `/api/v1/tracks/:trackId/comment`

Giữ `comment` số ít vì route hiện tại đang dùng path này.

### `GET /:trackId/comment` — đã có

Input query: `page`, `limit`, `parentId` tùy chọn. Output: Comment có author,
mới nhất trước. Không cần query Track trước; query comment đủ để trả danh sách.

### `POST /:trackId/comment` — đã có, Bearer

Input JSON:

```json
{
  "content": "Bài này hay",
  "parentId": null
}
```

Validation: content `1..1000` ký tự; nếu có parentId thì comment cha phải tồn
tại và thuộc cùng track. Output `201`: Comment có author.

### `PATCH /:trackId/comment/:commentId` — cần làm, tác giả

Input `{ "content": "Nội dung mới" }`. Output `200`: Comment đã sửa.

Thực hiện: tìm theo `_id + trackId`, kiểm tra `userId`, validate và update.

### `DELETE /:trackId/comment/:commentId` — cần làm, tác giả

Output `204`. Schema hiện chưa có soft-delete nên xóa comment và reply trực
tiếp có `parentId === commentId`.

## 7. Playlists — `/api/v1/playlists`, cần làm

Model `Playlist` tối thiểu:

```text
ownerId, name, description, coverImageUrl, coverImagePublicId,
visibility, tracks[{ trackId, addedAt }], timestamps
```

Index: `{ ownerId: 1, updatedAt: -1 }`. Không cần model trung gian cho MVP.

### `POST /`

Bearer. Input `multipart/form-data`: `name` bắt buộc `1..100`, `description`
tối đa `500`, `visibility=private|public`, `cover` tùy chọn. Output `201`:
Playlist.

### `GET /:playlistId`

Public nếu playlist public; Bearer owner nếu private. Input query `page`,
`limit` dùng để phân trang mảng track. Output Playlist cùng danh sách Track.

### `PATCH /:playlistId`

Bearer owner. Input giống create, tất cả tùy chọn. Output `200`: Playlist mới.

### `DELETE /:playlistId`

Bearer owner. Output `204`; xóa cover Cloudinary sau khi xóa DB.

### `POST /:playlistId/tracks`

Bearer owner. Input:

```json
{ "trackId": "trackId" }
```

Output `201`. Kiểm tra Track tồn tại và không thêm trùng.

### `DELETE /:playlistId/tracks/:trackId`

Bearer owner. Output `204`. `$pull` track khỏi playlist.

### `PATCH /:playlistId/tracks/order`

Bearer owner. Input:

```json
{ "trackIds": ["trackId1", "trackId2"] }
```

Output `200`. Danh sách phải chứa đúng toàn bộ track hiện tại, không trùng ID;
sau đó thay thứ tự mảng.

## 8. Search — `/api/v1/search`, cần làm khi có nhiều resource

### `GET /`

Input query:

```text
q=<required>&type=all|tracks|users|playlists&page=1&limit=20
```

Output `200`:

```json
{
  "data": {
    "tracks": [],
    "users": [],
    "playlists": []
  }
}
```

Thực hiện: escape keyword, query song song Track title, User name và public
Playlist name. Với `type` cụ thể thì trả pagination cho đúng resource. Chưa cần
Elasticsearch; MongoDB index/text search đủ cho quy mô MVP.

## 9. Charts và genres

### `GET /api/v1/genres` — cần làm

Input: không có. Output `200`:

```json
{
  "data": [
    { "slug": "pop", "name": "Pop" },
    { "slug": "rock", "name": "Rock" }
  ]
}
```

MVP lưu danh sách genre cố định trong một file constant dùng chung cho validate
và response; chưa cần collection Genre.

### Charts

All-time dùng `GET /tracks?sortKey=playCount...`, không tạo route mới. Nếu cần
chart ngày/tuần/tháng, thêm model `PlayEvent(trackId, userId?, sessionId,
createdAt)` và route:

```http
GET /api/v1/charts?period=day|week|month&genre=pop&limit=100
```

Output: Track cùng `rank`, `previousRank`, `playCountInPeriod`. Không thể tính
đúng chart theo thời gian chỉ từ `Track.playCount` hiện tại.

## 10. Radio và podcast

### Radio

Radio theo thể loại không cần model riêng. Client lấy seed từ:

```http
GET /tracks?genre=pop&sortKey=playCount&sortValue=desc&limit=100
```

Client shuffle queue. Chỉ tạo recommendation service khi dữ liệu nghe đủ lớn.

### Podcast — chỉ làm nếu sản phẩm giữ màn Podcast

Model mới `Podcast`: `ownerId`, `title`, `description`, `coverImage...`,
`category`, timestamps. Model `Episode`: `podcastId`, `title`, `description`,
`audioPublicId`, `duration`, `publishedAt`, `playCount`, timestamps.

Routes tối thiểu:

| Method | Path | Auth | Input/Output |
| --- | --- | :---: | --- |
| GET | `/podcasts` | Không | Filter/search/pagination, trả Podcast[] |
| POST | `/podcasts` | Có | Metadata + cover, trả `201` Podcast |
| GET | `/podcasts/:podcastId` | Không | Podcast và episode mới nhất |
| PATCH | `/podcasts/:podcastId` | Owner | Sửa metadata |
| DELETE | `/podcasts/:podcastId` | Owner | Xóa podcast, episode và asset |
| GET | `/podcasts/:podcastId/episodes` | Không | Episode[] phân trang |
| POST | `/podcasts/:podcastId/episodes` | Owner | Metadata + audio, trả `201` |
| GET | `/episodes/:episodeId/stream` | Không | Signed stream URL |
| PATCH | `/episodes/:episodeId` | Owner podcast | Sửa episode |
| DELETE | `/episodes/:episodeId` | Owner podcast | Xóa episode + asset |

## 11. Notifications — `/api/v1/notifications`, cần làm khi có follow

Model: `recipientId`, `actorId`, `type=follow|comment_reply`, `resourceId`,
`readAt`, timestamps.

| Method | Path | Auth | Hành vi |
| --- | --- | :---: | --- |
| GET | `/` | Bearer | Danh sách notification mới nhất, phân trang |
| GET | `/unread-count` | Bearer | `{ data: { count } }` |
| PATCH | `/:notificationId/read` | Bearer owner | Đặt `readAt` |
| PATCH | `/read-all` | Bearer | Đọc tất cả |

Không cần WebSocket ở MVP; header gọi unread-count khi load trang.

## 12. Admin — `/api/v1/admin`, cần role middleware

Chỉ thêm nếu có màn quản trị:

| Method | Path | Chức năng |
| --- | --- | --- |
| GET | `/users` | Danh sách/search user |
| PATCH | `/users/:userId/status` | Khóa hoặc mở tài khoản |
| GET | `/tracks` | Danh sách track để kiểm duyệt |
| DELETE | `/tracks/:trackId` | Gỡ track vi phạm và cleanup |
| DELETE | `/comments/:commentId` | Gỡ comment vi phạm |

Middleware `requireRole("admin")` chạy sau `requireAuth`. Không nhận role từ
request body ở API user thông thường.

## 13. Mapping màn hình → API

| Màn hình | API cần gọi |
| --- | --- |
| Login/Register | `/auth/login`, `/auth/register` |
| Home | `/tracks` với các sort/filter khác nhau |
| Explore | `/genres`, `/tracks?genre=...` |
| Charts | `/tracks?sortKey=playCount...` hoặc `/charts` khi có PlayEvent |
| Library | `/user/me/playlists`, `/user/me/history` |
| Favorites | `/user/me/likes` |
| Radio | `/tracks?genre=...` rồi shuffle phía client |
| Podcast | `/podcasts`, `/podcasts/:id/episodes` |
| Playlist detail | `/playlists/:playlistId` |
| Artist profile | `/user/:userId`, `/user/:userId/tracks` |
| Track detail/player | `/tracks/:id`, `/stream`, `/comment`, `/like` |
| Settings | `/user/me`, `/user/me/password`, `DELETE /user/me` |
| Notifications | `/notifications`, `/notifications/unread-count` |

## 14. Thứ tự triển khai cụ thể

### Phase 1 — sửa nền hiện tại

- [ ] Thêm error middleware cho Multer/Mongoose và response lỗi thống nhất.
- [x] Whitelist sort, giới hạn pagination, select field public của Track.
- [x] Thêm unique index Like; sửa like/unlike để counter không lệch.
- [x] Xóa Comment và Cloudinary asset khi xóa Track.
- [x] Thêm pagination + author cho comment.

### Phase 2 — hoàn thiện tính năng đã có trên UI

1. `GET track like status`, `GET user likes`.
2. Sửa/xóa comment.
3. Public artist profile và artist tracks.
4. Đổi mật khẩu, xóa tài khoản, logout mọi thiết bị.
5. Genre constant và route `/genres`.

### Phase 3 — library

1. Tạo Playlist model/controller/validate/route.
2. Tạo PlayHistory và cập nhật trong `POST /tracks/:id/plays`.
3. Tạo search tổng hợp sau khi Playlist tồn tại.

### Phase 4 — social

1. Follow model/routes.
2. Notification model/routes.
3. Chỉ thêm realtime khi polling thực tế không đáp ứng.

### Phase 5 — tùy phạm vi sản phẩm

1. Podcast/Episode nếu giữ màn podcast.
2. PlayEvent + chart theo kỳ nếu cần chart ngày/tuần/tháng.
3. Admin routes nếu có trang quản trị.

## 15. Cấu trúc file cần thêm

```text
backend/
  constants/genres.ts
  controllers/v1/
    playlist.controller.ts
    search.controller.ts
    follow.controller.ts
    notification.controller.ts
    podcast.controller.ts        # phase 5
  models/v1/
    playlist.model.ts
    playHistory.model.ts
    follow.model.ts
    notification.model.ts
    podcast.model.ts             # phase 5
    episode.model.ts             # phase 5
  routes/v1/
    playlist.route.ts
    search.route.ts
    genre.route.ts
    notification.route.ts
    podcast.route.ts             # phase 5
  validates/
    playlist.validate.ts
    comment.validate.ts
    podcast.validate.ts          # phase 5
```

Không tạo service/repository layer ở giai đoạn này: controller + model +
validate đang là pattern của codebase và đủ cho quy mô hiện tại.

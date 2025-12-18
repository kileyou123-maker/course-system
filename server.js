const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// 解析 JSON 格式的請求內容
app.use(express.json());

// 這裡需要替換成你在 MongoDB Atlas 取得的真實連線字串
// 範例格式：mongodb+srv://帳號:密碼@cluster0.xxxxx.mongodb.net/資料庫名稱?retryWrites=true&w=majority
// 注意：123456789 會導致 ConnectionString 錯誤
const mongoURI = 'mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/CourseDB?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
  .then(() => console.log('成功連接到 MongoDB 資料庫'))
  .catch(err => console.error('資料庫連線失敗，請檢查連線字串或網路狀態：', err));

// 定義訂單的資料結構 (Schema)
const orderSchema = new mongoose.Schema({
  customerName: String,
  courseName: String,
  orderDate: { type: Date, default: Date.now }
});

// 建立訂單模型 (Model)
const Order = mongoose.model('Order', orderSchema);

// 首頁路由
app.get('/', (req, res) => {
  res.send('訂購系統伺服器運行中！');
});

// 接收訂購課程的 API
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order({
      customerName: req.body.name,
      courseName: req.body.course
    });
    await newOrder.save();
    res.status(201).json({ message: '訂單已成功儲存！', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: '儲存失敗', error });
  }
});

// 取得所有訂單的 API (讓你可以在後台看到)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: '讀取失敗', error });
  }
});

app.listen(PORT, () => {
  console.log(`伺服器已啟動：http://localhost:${PORT}`);
});
// index.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// --- ここからがサーバーの準備 ---

// ★ JSON形式のリクエストを受け取れるようにする
app.use(express.json());
// ★ publicフォルダの中のファイルを公開する
app.use(express.static('public'));

// --- ここからがAPIの定義 ---

// GET: 次に表示する質問を取得するAPI
app.get('/api/question/next', async (req, res) => {
  try {
    const questionCount = await prisma.question.count();
    const skip = Math.floor(Math.random() * questionCount);
    const question = await prisma.question.findFirst({
      skip: skip,
    });
    
    const answerOptions = await prisma.answerOption.findMany();

    res.json({ question, answerOptions });
  } catch (error) {
    console.error('質問取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// POST: ユーザーの回答を記録するAPI
app.post('/api/answer', (req, res) => {
  const { questionId, answerOptionId } = req.body;
  console.log(`受け取った回答: 質問ID=${questionId}, 回答ID=${answerOptionId}`);
  
  res.json({ message: '回答を受け付けました。' });
});

// --- 最後にサーバーを起動する ---
// ★ この場所が重要じゃ！必ず一番下に書くこと！
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました。`);
});
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
/*app.get('/api/question/next', async (req, res) => {
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
});*/

// POST: ユーザーの回答を記録するAPI
/*app.post('/api/answer', (req, res) => {
  const { questionId, answerOptionId } = req.body;
  console.log(`受け取った回答: 質問ID=${questionId}, 回答ID=${answerOptionId}`);
  
  res.json({ message: '回答を受け付けました。' });
});*/

// index.js

// ... (app.useなどの準備)

// GET: 最初の質問を取得するためのシンプルなAPI（ページ読み込み時のみ使用）
app.get('/api/akinator/start', async (req, res) => {
  try {
    const question = await prisma.question.findFirst();
    const answerOptions = await prisma.answerOption.findMany();
    res.json({ question, answerOptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'エラーが発生しました' });
  }
});




// index.js

// POST: 回答履歴を受け取り、次の質問か最終結果を返すメインAPI
app.post('/api/akinator/next', async (req, res) => {
  const userAnswers = req.body.answers; // フロントエンドから送られてくる回答履歴
  
  if (!userAnswers || userAnswers.length === 0) {
    return res.status(400).json({ error: '回答がありません。' });
  }

  try {
    // 1. ユーザーの回答に完全に一致する飲食店を探す (ここは変更なし)
    const candidates = await prisma.restaurant.findMany({
      where: {
        AND: userAnswers.map(answer => ({
          restaurantAnswers: {
            some: {
              questionId: answer.questionId,
              answerOptionId: answer.answerOptionId,
            },
          },
        })),
      },
    });

    // 2. 候補が1つ以下になったら、結果を返す (ここは変更なし)
    if (candidates.length <= 1) {
      return res.json({ result: candidates[0] || null });
    }

    // //////////////////////////////////////////////////
    // ★★★ ここからが新しい質問選択ロジック ★★★
    // //////////////////////////////////////////////////

    // 3. まだ候補が複数ある場合、最も効果的な次の質問を選ぶ
    const answeredQuestionIds = userAnswers.map(answer => answer.questionId);
    const unansweredQuestions = await prisma.question.findMany({
        where: { id: { notIn: answeredQuestionIds } }
    });

    // もし聞くべき質問が残っていなければ、現時点での第一候補を結果とする
    if (unansweredQuestions.length === 0) {
        return res.json({ result: candidates[0] });
    }

    let bestQuestion = null;
    let bestQuestionScore = Infinity; // スコアは低い(ばらけている)ほど良い

    // 全ての「まだ聞いていない質問」について、スコアを計算する
    for (const question of unansweredQuestions) {
        const answerCounts = {}; // この質問に対する、現在の候補たちの回答分布

        // 現在の候補それぞれが、この質問にどう答えるかを集計
        for (const candidate of candidates) {
            const answer = await prisma.restaurantAnswer.findUnique({
                where: {
                    restaurantId_questionId: { // @@uniqueで設定した複合主キーで検索
                        restaurantId: candidate.id,
                        questionId: question.id,
                    }
                }
            });

            if (answer) {
                const aid = answer.answerOptionId;
                answerCounts[aid] = (answerCounts[aid] || 0) + 1;
            }
        }

        // スコア計算：最も回答がばらけている質問が良い質問とする
        // ここでは単純に「最大派閥の人数」をスコアとする。スコアが小さいほど、回答がばらけていることを意味する。
        const counts = Object.values(answerCounts);
        if (counts.length > 1) { // 2つ以上に回答が分かれている質問のみを評価
            const score = Math.max(...counts); 
            if (score < bestQuestionScore) {
                bestQuestionScore = score;
                bestQuestion = question;
            }
        }
    }
    
    // もし最適な質問が見つからなければ（例えば、どの質問も回答が1通りしかない場合など）、
    // 残っている質問から最初のものを返す
    if (!bestQuestion) {
        bestQuestion = unansweredQuestions[0];
    }

    const answerOptions = await prisma.answerOption.findMany();
    return res.json({ question: bestQuestion, answerOptions });

  } catch (error) {
    console.error('絞り込みエラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// index.js の既存のAPIの下、app.listenの前に追加

// POST: ユーザーが考えた新しい飲食店を登録するAPI
// index.js

// POST: ユーザーが考えた新しい飲食店を登録するAPI
app.post('/api/restaurants/register', async (req, res) => {
  // ★店名に加えて、「回答履歴」も受け取るようにする
  const { name, answers } = req.body;

  if (!name || !answers || answers.length === 0) {
    return res.status(400).json({ error: '店名または回答履歴がありません。' });
  }

  try {
    // 新しい飲食店と、それに対応する回答履歴を一度に作成する
    const newRestaurant = await prisma.restaurant.create({
      data: {
        name: name,
        // ★RestaurantAnswerテーブルにも、回答履歴をネストして同時に作成する
        restaurantAnswers: {
          create: answers.map(ans => ({
            questionId: ans.questionId,
            answerOptionId: ans.answerOptionId,
          })),
        },
      },
    });
    res.status(201).json(newRestaurant);
  } catch (error) {
    console.error('新規登録エラー:', error);
    if (error.code === 'P2002') { // ユニーク制約違反のエラーコード
      return res.status(409).json({ error: 'その名前の飲食店は既に存在します。' });
    }
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// index.js

// POST: 新しい店・新しい質問・回答履歴をまとめて登録する最終形態API
app.post('/api/restaurants/register-with-new-question', async (req, res) => {
    // 'answerValue'も受け取る
    const { name, question, answerValue, answers } = req.body;

    if (!name || !question || !answerValue || !answers) {
        return res.status(400).json({ error: '必要な情報が不足しています。' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. 新しい質問を「あれば使い、なければ作る(upsert)」
            const upsertedQuestion = await tx.question.upsert({
                where: { text: question },
                update: {}, // 既にあれば何もしない
                create: { text: question }, // なければ作る
            });

            // 2. ユーザーが選んだ回答（"yes"か"no"）のIDを取得
            const answerOption = await tx.answerOption.findFirst({
                where: { text: answerValue === 'yes' ? 'はい' : 'いいえ' }
            });
            if (!answerOption) throw new Error('回答の選択肢が見つかりません。');

            // 3. 新しい飲食店を作成し、同時に回答履歴も全て登録する
            const newRestaurant = await tx.restaurant.create({
                data: {
                    name: name,
                    restaurantAnswers: {
                        create: [
                            // 3a. 今までの回答履歴を登録
                            ...answers.map(ans => ({
                                questionId: ans.questionId,
                                answerOptionId: ans.answerOptionId,
                            })),
                            // 3b. そして、新しい質問に対する答えも登録！
                            {
                                questionId: upsertedQuestion.id,
                                answerOptionId: answerOption.id,
                            }
                        ]
                    }
                }
            });
            return newRestaurant;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('新規登録(新質問あり)エラー:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'その名前の飲食店は既に存在します。' });
        }
        res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});


// ... (app.listen)

// --- 最後にサーバーを起動する ---
// ★ この場所が重要じゃ！必ず一番下に書くこと！
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました。`);
});
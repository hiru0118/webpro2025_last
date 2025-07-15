// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log(`シード処理を開始します...`);

  // 既存データを全削除 (順番が重要！)
  await prisma.restaurantAnswer.deleteMany({});
  await prisma.restaurant.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.answerOption.deleteMany({});
  console.log('既存データを削除しました。');

  // 1. 回答選択肢の作成
  const yes = await prisma.answerOption.create({ data: { text: 'はい' } });
  const no = await prisma.answerOption.create({ data: { text: 'いいえ' } });
  const maybe = await prisma.answerOption.create({ data: { text: 'たぶんそう' } });
  const unknown = await prisma.answerOption.create({ data: { text: 'わからない' } });
  console.log('回答選択肢を作成しました。');

  // 2. 質問の作成
  const q1 = await prisma.question.create({ data: { text: 'ラーメンですか？' } });
  const q2 = await prisma.question.create({ data: { text: 'イタリアンですか？' } });
  const q3 = await prisma.question.create({ data: { text: '価格は1人あたり2000円以上しますか？' } });
  const q4 = await prisma.question.create({ data: { text: 'オシャレな雰囲気ですか？' } });
  console.log('質問を作成しました。');

  // 3. 飲食店と、それに対応する回答の作成
  const restaurantHitsuji = await prisma.restaurant.create({
    data: {
      name: '麺屋ひつじ',
      cuisine: 'ラーメン',
      priceRange: '¥',
      description: '仙人が打つ、秘伝の醤油ラーメン。',
      restaurantAnswers: { // restaurantAnswersも同時に作成する
        create: [
          { questionId: q1.id, answerOptionId: yes.id }, // ラーメンですか？ -> はい
          { questionId: q2.id, answerOptionId: no.id },  // イタリアンですか？ -> いいえ
          { questionId: q3.id, answerOptionId: no.id },  // 2000円以上？ -> いいえ
          { questionId: q4.id, answerOptionId: no.id },  // オシャレ？ -> いいえ
        ],
      },
    },
  });

  const restaurantGemini = await prisma.restaurant.create({
    data: {
      name: 'リストランテ・ジェミニ',
      cuisine: 'イタリアン',
      priceRange: '¥¥¥',
      description: '星空が見えるお洒落なイタリアン。',
      restaurantAnswers: {
        create: [
          { questionId: q1.id, answerOptionId: no.id },   // ラーメンですか？ -> いいえ
          { questionId: q2.id, answerOptionId: yes.id },  // イタリアンですか？ -> はい
          { questionId: q3.id, answerOptionId: yes.id },  // 2000円以上？ -> はい
          { questionId: q4.id, answerOptionId: yes.id },  // オシャレ？ -> はい
        ],
      },
    },
  });

  const restaurantMiso = await prisma.restaurant.create({
    data: {
      name: '味噌の仙人',
      cuisine: 'ラーメン',
      priceRange: '¥¥',
      description: '濃厚な味噌と太麺が絡み合う、食べ応え抜群の一杯。',
      restaurantAnswers: {
        create: [
          { questionId: q1.id, answerOptionId: yes.id },   // ラーメンですか？ -> はい
          { questionId: q2.id, answerOptionId: no.id },   // イタリアンですか？ -> いいえ
          { questionId: q3.id, answerOptionId: no.id },   // 2000円以上？ -> いいえ
          { questionId: q4.id, answerOptionId: maybe.id },// オシャレ？ -> たぶんそう
        ],
      },
    },
  });


  console.log('飲食店と回答の関連を作成しました。');
  console.log(`シード処理が完了しました。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
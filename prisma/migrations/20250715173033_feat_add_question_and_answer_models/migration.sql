-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerOption" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "AnswerOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantAnswer" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answerOptionId" INTEGER NOT NULL,

    CONSTRAINT "RestaurantAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_text_key" ON "Question"("text");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerOption_text_key" ON "AnswerOption"("text");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantAnswer_restaurantId_questionId_key" ON "RestaurantAnswer"("restaurantId", "questionId");

-- AddForeignKey
ALTER TABLE "RestaurantAnswer" ADD CONSTRAINT "RestaurantAnswer_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantAnswer" ADD CONSTRAINT "RestaurantAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantAnswer" ADD CONSTRAINT "RestaurantAnswer_answerOptionId_fkey" FOREIGN KEY ("answerOptionId") REFERENCES "AnswerOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

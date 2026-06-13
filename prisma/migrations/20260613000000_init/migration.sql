-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "translation" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'cet4',
    "style" TEXT NOT NULL DEFAULT 'story',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "phonetic" TEXT,
    "definition" TEXT,
    "chinese" TEXT,
    "example" TEXT,
    "articleId" INTEGER NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "phonetic" TEXT,
    "definition" TEXT,
    "chinese" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_word_key" ON "Favorite"("word");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

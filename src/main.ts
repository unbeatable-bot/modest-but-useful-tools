import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // const corsOptions = {
  //   origin: 'http://localhost:3001', // 요청을 허용할 도메인
  // };
  
  const cors = require('cors');
  const app = await NestFactory.create(AppModule);
  //main.ts에서의 configService사용방법
  const configService = app.get(ConfigService);
  app.use(cors());
  //app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
  
  //app.use(cors(corsOptions));
  await app.listen(Number(process.env.PORT) || configService.get("SERVER_PORT"));
}
bootstrap();

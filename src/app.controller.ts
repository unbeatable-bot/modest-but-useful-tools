import { Body, Controller, Get, Post, Req, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService) {}
    //const message = configServce.get('MESSAGE');
    private originalImageSavePath = this.configService.get('file.repository.original');
  // @Get('/')
  // async main(): Promise<string> {
  //   const message = this.configService.get('PDF_FILE_URL');
  //   const apiVersion = this.configService.get('apiVersion');
  //   console.log(message);
  //   console.log(apiVersion);
  //   console.log(this.configService.get('redis.host') + this.configService.get('redis.port'));
  //   console.log(process.env.NODE_ENV);
  //   return "finish";
  // }

  @Post('/file/upload')
  @UseInterceptors(FilesInterceptor('files', 600, {
    storage: diskStorage({
      destination: '/Users/verybuck/Documents/repository/image_crop/original',
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      },
    }),
  })) 
  async uploadFile(@Req() request: Request, @UploadedFiles() files: Express.Multer.File[], @Body('cropPoint') cropPoint: string) {
      console.log('uploadFile Controller In')  

      const uniqueKey = this.appService.makeUniqueKey();

      //Crop Image 생성
      const croppedImages = await this.appService.saveCroppedImage(files, JSON.parse(cropPoint), uniqueKey);
      console.log('crop Image 생성 결과: ', croppedImages);
      //Pdf 파일 생성
      const pdfFile = this.appService.makeImageToPdf(croppedImages, uniqueKey);
      //files.map(file => ({ filename: file.filename, path: file.path }));
      return {croppedImages, pdfFile};
  }
  
}

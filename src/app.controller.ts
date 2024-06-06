import { Body, Controller, Get, Param, Post, Req, Res, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService) {}
    private originalImageSavePath = this.configService.get('file.repository.original');

  @Post('/file/upload')
  @UseInterceptors(FilesInterceptor('files', 600, {
    storage: diskStorage({
      //destination: '/Users/verybuck/Documents/repository/image_crop/original',
      destination: './image_crop/original',
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      },
    }),
  })) 
  async uploadFile(
    @Req() request: Request, @UploadedFiles() files: Express.Multer.File[],
    @Body('cropPoint') cropPoint: string,
    @Body('previewSize') previewSize: string
  ) {
      console.log('uploadFile Controller In')  

      const uniqueKey = this.appService.makeUniqueKey();

      //Crop Image 생성
      const croppedImages = await this.appService.saveCroppedImage(files, JSON.parse(cropPoint), JSON.parse(previewSize), uniqueKey);
      console.log('crop Image 생성 결과: ', croppedImages);
      //Pdf 파일 생성
      if(typeof croppedImages === 'string') {
        return croppedImages
      } else {
        const pdfFile = await this.appService.makeImageToPdf(croppedImages, uniqueKey);
        return {croppedImages, pdfFile};
      }
  }
  
  @Get('/imageCrop/downloadPdf/:filename')
  imageCropDownloadPdf(@Param('filename') filename: string, @Res() res:Response) {
    console.log('imageCropDownloadPdf start');

    const pdfFilePath = this.configService.get('file.repository.pdf');
    const filePath = path.join(pdfFilePath, '/', filename);

    res.download(filePath, (err) => {
      console.log(err);
    });
  }
}

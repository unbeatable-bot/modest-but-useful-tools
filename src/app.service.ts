import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService, ) {}

  //1. cropped 이미지 생성 순서
  // 버퍼 데이터를 받는다
  // 이미지를 crop한다.

  async saveCroppedImage(images: Express.Multer.File[], cropPoint: any, uniqueKey:string) {
    console.log('saveCroppedImage Service In');

    const maxWidth = this.configService.get('file.size.width');
    const maxHeight = this.configService.get('file.size.height');

    cropPoint.x = Math.round(cropPoint.x);
    cropPoint.y = Math.round(cropPoint.y);
    cropPoint.width = Math.round(cropPoint.width);
    cropPoint.height = Math.round(cropPoint.height);
    
    const targetWidth = cropPoint.width - cropPoint.x;
    const targetHeight = cropPoint.height - cropPoint.y;
    
    //리사이징 대상 여부 확인(A4기준)
    let isRquireResizing = false;
    
    if( maxWidth < targetWidth || maxHeight <targetHeight ) {
      isRquireResizing = true;
    }
    
    let createdFiles = [];
    for(let image of images) {
      const createdFileName = await this.cropImage(image.path, image.originalname, cropPoint, isRquireResizing, uniqueKey);
      createdFiles.push(createdFileName);
    }

    return createdFiles;
  }

  //Crop Image Function
  private async cropImage(targetFile: string, originalFileName: string, cropPoint: any, isRquireResizing: boolean, uniqueKey: string) {
    const saveFilePath = this.configService.get('file.repository.cropped') + uniqueKey;
    const fileNameNoExtention = originalFileName.split('.')[0];
    //to-do image 데이터를 스트림 형식으로 저장하기/받아오기 : 파일로 받아오면 저장공간 이슈
    
    //디렉토리 생성
    if(!fs.existsSync(saveFilePath)) {
      try {
        await fs.promises.mkdir(saveFilePath, { recursive: true });
        console.log(`디렉토리 생성: ${saveFilePath}`);
      } catch (error) {
        console.error(`디렉토리 생성 실패: ${saveFilePath}`, error);
      }
    }
    return new Promise((resolve, reject) => {
      sharp(targetFile)
      .extract({ left: cropPoint.x, top: cropPoint.y, width: cropPoint.width, height: cropPoint.height })
      .toBuffer()
      .then(async (buffer) => {
        try{
          if(isRquireResizing) {
            const createdFileName = await this.resizeImagesFitA4(buffer, saveFilePath, fileNameNoExtention);
            console.log('resizing: ', createdFileName);
            resolve(createdFileName);
          } else {
            const createdFileName = await this.bufferToPngFile(buffer, saveFilePath, fileNameNoExtention);
            console.log('no resizing: ', createdFileName);
            resolve(createdFileName);
          }
        } catch(error) {
          reject(error);
        }
      })
    });
  }

  //A4 사이즈로 이미지 리사이징
  async resizeImagesFitA4(buffer: Buffer, saveFilePath:string, originalFileName:string) {
    const imageWidth = this.configService.get('file.size.width');
    const imageHeight = this.configService.get('file.size.height');

    const resizedBuffer = await sharp(buffer)
                                .resize({width: imageWidth, height: imageHeight})
                                .toBuffer();

    return await this.bufferToPngFile(resizedBuffer, saveFilePath, originalFileName);
  }

  //buffer를 png파일로 생성
  async bufferToPngFile(buffer: Buffer, saveFilePath:string, fileNameNoExtention:string) {
    await sharp(buffer).png({quality:100})
          .toFile(`${saveFilePath}/cropped_${fileNameNoExtention}.png`);

    const createdFileName = `${saveFilePath}/cropped_${fileNameNoExtention}.png`;
    console.log(`${createdFileName} created`);
    return createdFileName;
  }

  makeImageToPdf(imageList: Array<string>, uniqueKey: string) {
    console.log('makeImageToPdf In');

    const pdfSavePath = this.configService.get('file.repository.pdf');

    const doc = new PDFDocument({size: 'A4', autoFirstPage: false});

    const pdfFileName = `${pdfSavePath}/${uniqueKey}.pdf`;
    doc.pipe(fs.createWriteStream(pdfFileName));

    for(let image of imageList) {
      // Add an image, constrain it to a given size, and center it vertically and horizontally
      doc.addPage({size: 'A4'}).image(image, 0,15);
    }

    doc.end();
    console.log(`${pdfFileName} PDF created`);
    return pdfFileName;
  }

  //유니크 키 생성
  makeUniqueKey():string {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');
    const dateString = `${year}${month}${day}${hours}${minutes}${seconds}`;

    return dateString;
  }

  //데이터 정렬하기
  //original_data_create_date

  //이미지 pdf로 만들기

  //이미지 압축하기

  //pdf 다운로드
  //압축파일 다운로드

}

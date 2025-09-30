import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// 读取文件为 base64，然后转为 hex
export async function getImageAsBase64(uri: string): Promise<string> {
  // 使用 FileSystem 读取文件为 base64
  console.log('uri ', uri);
  const base64Data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  // 转为 hex 编码
  // const hexData = Buffer.from(base64Data, "base64").toString("hex");
  // console.log("hexData ", hexData);
  // return hexData;
  return base64Data;
}

// 读取文件为 base64，然后转为 hex
export async function getImageAsHex(uri: string): Promise<string> {
  // 使用 FileSystem 读取文件为 base64
  console.log('uri ', uri);
  const base64Data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  // 转为 hex 编码
  const hexData = Buffer.from(base64Data, 'base64').toString('hex');
  // console.log("hexData ", hexData);
  return hexData;
}

export async function getPicImage(): Promise<string[] | null> {
  //   const [images, setImages] = useState([]); // 存储图片 URI 的数组
  //   const [hasPermission, setHasPermission] = useState(null);

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Lack of authority',
      'You need access to albums to select pictures, turn this on in Settings.',
    );
    return null;
  }

  //   if (images.length >= 1) {
  // Alert.alert("Tip", "You can only select up to 9 images");
  // return;
  //   }
  //   console.log('hasPermission ', hasPermission);

  try {
    let result = await ImagePicker.launchImageLibraryAsync({
      // mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled) {
        console.log('取消选择');
      return null;
    }

    // if (!result.canceled) {
      //   setSelectedImage(result.assets[0].uri);
      //   setImages((prevImages) => [...prevImages, ...result.assets.map((asset) => asset.uri)]);
      // setImages((prevImages) => [
      //   ...prevImages,
      //   ...result.assets, // 👈 保存完整对象，而不是 asset.uri
      // ]);
      const images=result.assets.map((asset) => asset.uri);
    //   console.log('images返回：', images);
      return images;
    // }
  } catch (error) {
    console.log('error ', error);
  }
}







/**
 * 将本地图片压缩到指定大小（KB）
 * @param uri 图片本地路径（file://开头）
 * @param maxSizeKB 目标大小，单位 KB，默认 1024 KB
 * @returns 返回压缩后的图片 URI
 */
export async function compressToTarget(uri: string, maxSizeKB: number = 1024): Promise<string> {
  let compress = 1; // 初始质量为 100%
  let result = { uri };
  
  // 获取文件大小的函数
  async function getSizeInKB(uri: string): Promise<number> {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (info.exists && typeof info.size === 'number') {
      return info.size / 1024;
    }
    return 0;
  }

  let sizeKB = await getSizeInKB(result.uri);
  
  // 循环压缩直到达到目标大小或质量太低
  while (sizeKB > maxSizeKB && compress > 0.1) {
    compress -= 0.1; // 每次降低 10% 质量

    result = await ImageManipulator.manipulateAsync(
      result.uri,
      [], // 不修改尺寸
      { compress, format: ImageManipulator.SaveFormat.JPEG }
    );

    sizeKB = await getSizeInKB(result.uri);
  }

  return result.uri;
}







  // 获取文件大小的函数
  export async function getSizeInKB(uri: string): Promise<number> {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (info.exists && typeof info.size === 'number') {
      return info.size / 1024;
    }
    return 0;
  }



  /**
 * 将本地图片压缩到指定大小（KB），可选指定最大宽高
 * @param uri        图片本地路径（file://开头）
 * @param maxSizeKB  目标大小，单位 KB，默认 1024 KB
 * @param maxWidth   （可选）压缩后的最大宽度
 * @param maxHeight  （可选）压缩后的最大高度
 * @returns 返回压缩后的图片 URI
 */
export async function compressToTargetChip(
  uri: string,
  maxSizeKB: number = 1024,
  maxWidth?: number,
  maxHeight?: number
): Promise<string> {
  let compress = 1; // 初始质量 100%
  let result = { uri };

  async function getSizeInKB(path: string): Promise<number> {
    const info = await FileSystem.getInfoAsync(path, { size: true });
    return info.exists && typeof info.size === 'number' ? info.size / 1024 : 0;
  }

  let sizeKB = await getSizeInKB(result.uri);

  // 获取原始尺寸
  const { width: origW, height: origH } = await ImageManipulator.manipulateAsync(result.uri, []);

  // 如果用户设置了 maxWidth/Height，就先计算一次初始缩放比例
  let baseScale = 1;
  if (maxWidth && origW > maxWidth) baseScale = Math.min(baseScale, maxWidth / origW);
  if (maxHeight && origH > maxHeight) baseScale = Math.min(baseScale, maxHeight / origH);

  // 初始缩放后的目标宽高
  let targetW = Math.floor(origW * baseScale);
  let targetH = Math.floor(origH * baseScale);

  while (sizeKB > maxSizeKB && compress > 0.1) {
    // 如果还没达到 maxWidth/Height，则逐步再缩
    if (!maxWidth && !maxHeight) {
      targetW = Math.floor(targetW * 0.9);
      targetH = Math.floor(targetH * 0.9);
    }

    result = await ImageManipulator.manipulateAsync(
      result.uri,
      [{ resize: { width: targetW, height: targetH } }],
      { compress, format: ImageManipulator.SaveFormat.JPEG }
    );

    sizeKB = await getSizeInKB(result.uri);
    if (sizeKB > maxSizeKB) compress -= 0.1; // 逐步降低质量
  }

  return result.uri;
}
import { View, Text, TouchableWithoutFeedback, Keyboard, TextInput } from 'react-native';
import React, { use, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AvatarImageView,
  LoadingModal,
  RoundSimButton,
  TitleBar,
  ToastView,
} from '@/constant/Widget';
import { grayNormalColor, metaStyles, normalColor } from '@/constant/Constants';
import { useTranslation } from 'react-i18next';
import { goBack, navigate } from '@/base/NavigationService';
import { compressToTarget, compressToTargetChip, getImageAsBase64, getPicImage } from '@/utils/ImageUtils';
import { isEmpty, isNotEmpty } from '@/utils/StringUtils';
import { createOrUpdateUserInfo, getEcdhPublickey, getMVCRewards } from '@/wallet/userInfo';
import useUserStore from '@/stores/useUserStore';
import {
  btcSignMessage,
  getBTCWalletPublicKey,
  getECDHData,
  getMvcAddress,
} from '@/wallet/walletUtils';
import { useData } from '@/hooks/MyProvider';
import { getRandomID, getRandomNum } from '@/utils/WalletUtils';

export default function PeoInfoPage() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState('');
  const [name, setName] = useState('');
  const [profile, setProfile] = useState('');
  const [isShowLoading, setIsShowLoading] = useState(false);
  const { switchAccount, updateSwitchAccount } = useData();
  const { reloadWebKey, updateReloadKey } = useData();

  async function sendInfo() {
    if (isEmpty(name)) {
      ToastView({ text: 'Please enter the name', type: 'info' });
      return;
    }
    try {
      setIsShowLoading(true);
      console.log('name ', name + ' profile :' + profile + ' selectedImage: ' + selectedImage);
      const values: any = {};
      // if (imgRaw.value) {
      //   const [image] = await image2Attach(([imgRaw.value] as unknown) as FileList)
      //   values.avatar = Buffer.from(image.data, 'hex').toString('base64')
      // }
      if (selectedImage != null && selectedImage !== '') {
        console.log('selectedImage ', selectedImage);
        // const compressUri = await compressToTarget(selectedImage, 1024);
        const compressUri = await compressToTargetChip(selectedImage, 100, 100, 100);

        console.log('compressUri ', compressUri);

        const imageBase64 = await getImageAsBase64(compressUri);
        values.avatar = imageBase64;
      }

      values.name = name;
      values.bio = profile;

      const ecdh = await getEcdhPublickey();
      const chatpubkey = ecdh.ecdhPubKey;
      console.log('chatpubkey ', chatpubkey);
      if (isNotEmpty(chatpubkey)) {
        values.chatpubkey = chatpubkey;
      }

      const result = await createOrUpdateUserInfo({
        userData: values,
        // oldUserData: {
        //   nameId: useUserStore.getState().userInfo?.nameId || '',
        //   bioId: useUserStore.getState().userInfo?.bioId || '',
        //   avatarId: useUserStore.getState().userInfo?.avatarId || '',
        //   backgroundId: useUserStore.getState().userInfo?.backgroundId || '',
        //   chatpubkey: chatpubkey,
        // },
        oldUserData: {
          nameId: '',
          bioId: '',
          avatarId: '',
          backgroundId: '',
          chatpubkey: chatpubkey,
        },
        options: {
          feeRate: 1,
          network: 'mainnet',
          assistDomain: 'https://www.metaso.network/assist-open-api',
        },
      });
      console.log('result ', result);
      if (isNotEmpty(result.nameRes!.txid!)) {
        const publicKey = await getBTCWalletPublicKey();
        const signature: any = await btcSignMessage('metaso.network');
        const address = await getMvcAddress();

        const result = await getMVCRewards(
          {
            address: address,
            gasChain: 'mvc',
          },
          {
            'X-Public-Key': publicKey + '',
            'X-Signature': signature,
          },
        );

        console.log('getMVCRewards result ', result);
        if (result.code == 0) {
          setIsShowLoading(false);
          ToastView({ text: 'successfully', type: 'success' });
          useUserStore.getState().setUserInfo({ name: name });
          goBack();
          useUserStore.getState().updateUserField('avatarLocalUri', selectedImage);
          updateSwitchAccount(getRandomID());
          updateReloadKey(getRandomNum());
          navigate('Tabs');
          // navigate('SplashPage');
        } else {
          setIsShowLoading(false);
          ToastView({ text: result.message, type: 'error' });
        }
      } else {
        setIsShowLoading(false);
        ToastView({ text: 'The service is busy. Please try again later', type: 'info' });
      }
    } catch (e) {
      console.log('e', e);
      setIsShowLoading(false);
      ToastView({ text: e.toString(), type: 'info' });
    }
  }

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        console.log('click');
        Keyboard.dismiss();
      }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <LoadingModal
          isShow={isShowLoading}
          isCancel={true}
          event={() => {
            setIsShowLoading(false);
          }}
        />
        <TitleBar />
        <View style={[metaStyles.verMarginContainer, { marginBottom: 50 }]}>
          <Text style={[metaStyles.largeDefaultText, { fontWeight: 'bold' }]}>
            {t('chat_peo_profile_title')}
          </Text>
          <Text style={[metaStyles.grayTextSmall66, { marginTop: 10 }]}>
            {t('chat_peo_profile_notice')}
          </Text>

          <Text style={[metaStyles.grayTextdefault66, { marginTop: 10 }]}>
            {t('chat_peo_basic_info')}
          </Text>

          <TouchableWithoutFeedback
            onPress={async () => {
              const images = await getPicImage();
              selectedImage != null && setSelectedImage(images![0]!);
              //   console.log('images ', images);
            }}
          >
            <View
              style={{
                marginTop: 20,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'flex-end',
              }}
            >
              <Text style={[metaStyles.grayTextdefault66, { marginTop: 10, width: 50 }]}></Text>
              {/* <AvatarImageView size={80} source={selectedImage!=null?{uri:selectedImage}:require('@image/avatar_default_icon.png')} /> */}
              <AvatarImageView
                size={80}
                source={
                  selectedImage === ''
                    ? require('@image/avatar_default_icon.png')
                    : {
                        uri: selectedImage,
                      }
                }
              />
              <Text style={[metaStyles.grayTextdefault66, { marginTop: 10 }]}>
                {t('chat_peo_optional')}
              </Text>
            </View>
          </TouchableWithoutFeedback>

          <TextInput
            placeholder={t('chat_peo_name')}
            // value={'inputAddress'}
            onChangeText={(text) => {
              setName(text);
            }}
            onFocus={() => {
              // setIsInputAddressFcous(true);
              // setIsInputAmountFcous(false);
            }}
            placeholderTextColor={normalColor}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              // textAlignVertical: "left",
              padding: 10,
              borderWidth: 1,
              height: 50,
              borderRadius: 10,
              color: normalColor,
              borderColor: 'rgba(191, 194, 204, 0.5)',
              marginTop: 30,
            }}
          />

          <TextInput
            placeholder={t('chat_peo_profile_optional')}
            multiline={true}
            placeholderTextColor={normalColor}
            numberOfLines={6}
            // style={[
            //   metaStyles.textInputDefault,
            //   { paddingVertical: 20, height: 135, textAlignVertical: 'top' },
            // ]}
            onChangeText={(text) => {
              setProfile(text);
            }}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              // textAlignVertical: "left",
              padding: 10,
              borderWidth: 1,
              borderRadius: 10,
              color: normalColor,
              borderColor: 'rgba(191, 194, 204, 0.5)',
              marginTop: 30,
              height: 135,
              textAlignVertical: 'top',
            }}
          />

          <View style={{ flex: 1 }} />

          {/* <GradientAvatar/> */}
          <RoundSimButton
            title={t('c_confirm')}
            event={() => {
              sendInfo();
            }}
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

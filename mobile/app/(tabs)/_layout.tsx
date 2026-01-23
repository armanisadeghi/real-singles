import { icons } from '@/constants/icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Image, ImageBackground, View } from 'react-native'

const TabIcon = ({focused, icon, title}: any) => {
  if(!focused){
    return (
      <View className='size-full justify-center items-center mt-7 rounded-full'>
        <Image source={icon} className="size-7" tintColor="#ffffff" resizeMode='contain'/>
      </View>
    )
  }
  return (
    <ImageBackground
    source={icons.highlight}
    className={`${title ? 'flex flex-row w-full flex-1 min-w-[36px] min-h-10 mt-7 justify-center items-center rounded-full overflow-hidden' : 'flex flex-row w-full flex-1 min-w-[70px] min-h-16 mt-4 justify-center items-center rounded-full overflow-hidden'}`}
    >
      <Image source={icon} tintColor={`${title ? '#ffffff' : null}`} className="size-4" resizeMode='contain' />
    </ImageBackground>
  )
}

const _layout = () => {
  return (
    <Tabs
    screenOptions={{
      tabBarShowLabel: false,
      tabBarItemStyle: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      },
      tabBarStyle: {
        backgroundColor: '#1D2733',
        borderRadius: 56,
        marginHorizontal: 20,
        marginBottom: 50,
        height: 68,
        position: 'absolute',
        overflow: 'hidden',
      }
    }}
    >
        <Tabs.Screen 
        name='index'
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon={icons.home} title="Home"/>
          )
        }}
        />
        <Tabs.Screen 
        name='chats'
        options={{
          title: 'Chats',
          headerShown: false,
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon={icons.chats} title="Chats"/>
          )
        }}
        />
        <Tabs.Screen 
        name='favourites'
        options={{
          title: 'Favourites',
          headerShown: false,
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon={icons.heart} title="Favourites"/>
          )
        }}
        />
        <Tabs.Screen 
        name='profile'
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon={icons.profile} title="Profile"/>
          )
        }}
        />
    </Tabs>
  )
}

export default _layout
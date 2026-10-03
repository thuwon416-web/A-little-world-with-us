import React from 'react'
import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import { haptics } from '@/lib/haptics'

type ButtonVariant = 'primary' | 'secondary' | 'outline'
interface ButtonProps { title: string; variant?: ButtonVariant; disabled?: boolean; accessibilityHint?: string; onPress?: () => void; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle> }
export function Button({ title, variant='primary', disabled=false, accessibilityHint, onPress, style, textStyle }: ButtonProps) {
 const { colors } = useTheme(); const outline=variant==='outline'
 return <Pressable style={({pressed})=>[styles.base,{backgroundColor:variant==='primary'?colors.accent1:variant==='secondary'?colors.accent3:colors.surface},outline?{borderColor:colors.cardBorder}:undefined,disabled?styles.disabled:undefined,style,pressed?styles.pressed:null]} onPress={()=>{if(!disabled){void haptics.light();onPress?.()}}} disabled={disabled} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={accessibilityHint} accessibilityState={{disabled}}><Text style={[styles.text,{color:outline?colors.textPrimary:colors.background},textStyle]}>{title}</Text></Pressable>
}
const styles=StyleSheet.create({base:{borderRadius:999,paddingVertical:13,paddingHorizontal:18,minHeight:46,alignItems:'center',justifyContent:'center'},text:{fontWeight:'700',fontSize:15},disabled:{opacity:0.48},pressed:{opacity:0.82,transform:[{scale:0.985}]}})

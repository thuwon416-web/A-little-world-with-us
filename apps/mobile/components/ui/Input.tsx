import React from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
interface InputProps extends TextInputProps { label?: string; error?: string }
export function Input({label,error,style,...props}:InputProps){const {colors}=useTheme();return <View style={styles.container}>{label?<Text style={[styles.label,{color:colors.textPrimary}]}>{label}</Text>:null}<TextInput {...props} style={[styles.input,{backgroundColor:colors.surface,color:colors.textPrimary,borderColor:error?colors.error:colors.cardBorder},style]} placeholderTextColor={colors.textSecondary} accessibilityLabel={label??props.placeholder}/>{error?<Text style={[styles.error,{color:colors.error}]}>{error}</Text>:null}</View>}
const styles=StyleSheet.create({container:{marginBottom:14},label:{fontSize:13,lineHeight:18,marginBottom:7,fontWeight:'600'},input:{borderRadius:12,borderWidth:1,minHeight:46,paddingHorizontal:13,paddingVertical:11,fontSize:15},error:{fontSize:12,lineHeight:17,marginTop:6}})

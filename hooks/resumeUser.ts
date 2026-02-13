import { RegisterData, UserService } from '@/services/userService';

import { useMutation } from '@tanstack/react-query';


export const CreateUser = (user: RegisterData) => {
  if(!user.email || user.password) throw new Error('Please fill the madatory fields');
  return useMutation({
    mutationFn: async()=> await UserService.createUser(user)
  })
};


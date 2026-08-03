package com.civiclens.civiclens.service;

import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(User user) {
        return userRepository.save(user);
    }

}
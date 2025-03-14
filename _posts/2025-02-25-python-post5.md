---
layout: post
title:  2025-02-25 python
description: python coding test
date:   2025-02-25 
image:  '/images/velog-썸네일-001 (7).png'
tags:   [coding]
---
# 1. 인덱스 바꾸기 
-> replace는 모든 값을 바꾼다. 또 한 번 생성된 문자열은 수정할 수 없다. (새로 정의해야함) -> 리스트로 바꿔서 하기
```python
def solution(my_string, num1, num2):
    list_my_string = list(my_string)
    list_my_string[num1], list_my_string[num2] = list_my_string[num2], list_my_string[num1]
    return "".join(list_my_string)
```

# 2. 약수 구하기
```python
def solution(n):
    answer = []
    for i in range(1, n+1):
      if n % i == 0:
        answer.append(i)
    return answer
```

# 3. 가장 큰 수
```python
def solution(array):    
    return [max(array), array.index(max(array))]
```

# 4. 숫자만 오름차순 정렬
```ppython
def solution(my_string):
    answer = []
    for i in my_string:
        if i.isdigit():
            answer.append(int(i))
    return sorted(answer)
```

# 5. 암호해독
```python
def solution(cipher, code):
    answer = ""
    for i in range(code - 1,len(cipher), code): # len이 이미 인덱스 + 1이므로 이렇게만 해도된다.
        answer += cipher[i]
    return answer

# 문자열이니까 슬라이싱으로 해도된다.
def solution(cipher, code):

    return cipher[code-1::code]
```

# 6. 주사위의 개수
```python
def solution(box, n):
    return (box[0] // n) * (box[1] // n) * (box[2] // n)

# 파이썬은 리스트에 변수를 자동으로 할당해준다.
def solution(box, n):
    x, y, z = box
    return (x // n) * (y // n) * (z // n )
```

# 7. 문자열 정렬하기 2
```python
def solution(my_string):
    answer = []
    for i in my_string:
        if i.isupper():
            answer.append(i.lower())         
        else:
            answer.append(i)
    return "".join(sorted(answer))

# string에도 sorted가 되며(join으로 합쳐주어야하기는 하다.) lower는 소문자도 소문자로 만든다.
def solution(my_string):
    return ''.join(sorted(my_string.lower()))
```

# 8. 제곱수 판별하기 
-> 1로 나눈 나머지가 0이면 소숫점이 없다.
```python
def solution(n):
    return -((i**0.5) % 1 == 0) + 2
```

# 9. 외계행성의 나이 
-> 딕셔너리 키는 정수인데 str로 돌리므로 int 로 맞춰줘야함.
```python
def solution(age):
    dic = {0:"a",1:"b",2:"c",3:"d",4:"e",5:"f",6:"g",7:"h",8:"i",9:"j"}
    answer = []
    for i in str(age):
        answer.append(dic[int(i)])
    return "".join(answer)
```
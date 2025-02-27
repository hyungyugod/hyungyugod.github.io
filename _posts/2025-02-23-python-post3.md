---
layout: post
title:  2025-02-23 python
description: python coding test
date:   2025-02-23 
image:  '/images/velog-썸네일-001 (1).png'
tags:   [coding]
---
# 1. 아이스 아메리카노
```python
def solution(money):
    a, b = divmod(money, 5500)
    return [a, b]

# 리스트와 튜플은 모두 배열이라 답에 지장이 없다. (배열을 반환하라했으므로)
def solution(money):
    return divmod(money, 5500) # 튜플로 반환
```

# 2. 문자열 역순 
-> 자꾸 슬라이싱 쓰려고 해서,,
```python
def solution(my_string):
    return ''.join(reversed(my_string)) 
    # .join으로 뒤집은 이터레이터 객체를 문자열로 합쳐주기

# for 문에서 range -1로 역순으로 배열 꺼내기
def solution(my_string):
    answer = ''
    for i in range(len(my_string)-1, -1, -1) :    
        # 처음 시작은 총길이보다 인덱스가 1 작아서, 끝나는건 한칸 덜가니까
        answer += my_string[i]
    return answer

# 뒤에다 합쳐서 문자열 역순 만들기
def solution(my_string):
    answer = ""
    for i in my_string:
        answer = i + answer
    return answer
```
# 3 특정문자 제거하기 
-> 문자열도 배열이어서 for로 출력할 수 있다.
```python
def solution(my_string, letter):
  answer = ""
  for i in my_string:
    if i != letter:
      answer += i
  return answer

# replace로 문자열 한번에 바꾸기 -> 원본 문자열 변경
def solution(my_string, letter):
    return my_string.replace(letter, '')
```
# 4. 문자 반복 출력
```python
def solution(my_string, n):
  answer = ""
  for i in my_string:
    answer += i * n
  return answer

# 리스트 컴프리헨션 + join으로 문자열 합치기
def solution(my_string, n):
    return ''.join(i*n for i in my_string)
```

# 5. 직각 삼각형 출력하기
```python
n = int(input())
for i in range(1, n+1):
  print(i * "*")
```

# 6. 짝수 홀수 개수
```python
def solution(num_list):
    a = 0                     # 이렇게 내가 생각해봐도 비효율적인건 무조건 합칠 수 있다.
    b = 0
    for i in num_list:
      if i % 2 == 0:
        a += 1
      else:
        b += 1
    return [a, b]

# 두가지 케이스를 리스트에 담아야할때 두 가지 케이스를 리스트 인덱스에 할당하여 한번에 답에 정리할 수 있다.
def solution(num_list):
  answer = [0,0]  # 방을 만들어 두어야함.
  for i in num_list:
    answer[i % 2] += 1
  return answer
```

# 7. 배열 자르기
```python
def solution(numbers, num1, num2):
    answer = numbers[num1:num2 +1]
    return answer
```

# 8. 점의 위치 구하기
```python
def solution(dot):
    if dot[0] > 0 and dot[1] > 0:
        answer = 1
    elif dot[0] < 0 and dot[1] > 0:
        answer = 2
    elif dot[0] < 0 and dot[1] < 0:
        answer = 3
    elif dot[0] > 0 and dot[1] < 0: # 마지막은 그냥 else 해도된다.
        answer = 4
    return answer

# 인덱스 안의 인덱스로 4가지 경우 표기하기 (2 * 2니까 가능)
def solution(dot):
    return[[3, 2],[4, 1]][dot[0] > 0][dot[1] > 0]
```

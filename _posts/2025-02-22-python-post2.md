---
layout: post
title:  2025-02-22 python
description: python coding test
date:   2025-02-22 
image:  '/images/velog-썸네일-001 (2).png'
tags:   [coding]
---
# 1. 편지 
-> len이 문자열, 리스트 둘 다 가능
```python
def solution(message):    
    return 2 * (len(message))
```

# 2. 치킨 쿠폰 
```python
def solution(chicken):
    answer = chicken // 10            # 치킨 = 쿠폰이니까 10으로 나눠서 바로 치킨을 보너스 치킨으로
    c = chicken // 10 + chicken % 10  # 처음 바꾸고 쿠폰은 보너스 치킨 + 남은 쿠폰이된다.
    while c >= 10:                    # 참일 동안만 반복한다.
        a = c // 10                   # 쿠폰 개수가 바뀌면서 10개마다 보너스 치킨 추가가
        b = c % 10
        answer += a
        c = a + b
    return answer

# 수정
answer = chicken // 10           
    c = chicken // 10 + chicken % 10  

# 이 식과

answer += a
c = a + b

# 이 식이 같은 구조이므로 위의 식을 지우고 변수를 통일해도 바뀌는게 없다.

# 이거 왜 안됨? -> 비교연산으로 처리되기 때문이다.
divmod(10, 3) == a, b 
print(a)

# 수정 
a, b = divmod(10, 3) # 이렇게 할당해주어야 한다. 오른 -> 왼이므로

# 수업식 풀이 -> 처음에 치킨이라는 개념을 이후엔 쿠폰으로 바꿈 , 초항을 이후항에 편입시킬 수 있는지 고민하기
def solution(chicken):
    answer = 0
    while chicken >= 10:
        a, b = divmod(chicken, 10)
        answer += a
        chicken = a + b
    return answer

# 수학적 이해
def solution(chicken):
    return int(chicken*0.11111111111)  

# 10으로 나눈 값을 나머지까지 더한다? -> 10으로 거듭해서 나눈 값들을 무한히 더한다. 
# -> 무한등비급수의 합 a/1-r -> 1/n 씩 반복적으로 특정 비율을 차지하면서 더하면 1/n-1에 근사 -> 신기하다.
```

# 3. 피자 2
```python
import math as m
def solution(n):
    a = m.gcd(6, n)
    return n//a

# 최소 공배수 좋은 접근 -> 한 수에다가 몇을 곱해야 n으로 나누어 떨어지는가
def solution(n):
    answer = 1
    while 6 * answer % n:
        answer += 1
    return answer
```

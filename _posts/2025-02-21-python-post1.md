---
layout: post
title:  2025-02-21 python
description: python coding test
date:   2025-02-21 
image:  '/images/velog-썸네일-001 (3).png'
tags:   [coding]
---
# 1. 중앙값 구하기
```python
def solution(array):
    sort_array = sorted(array)
    x = len(sort_array)
    return sort_array[(x + 1) // 2 - 1]

# len은 문자열과 리스트에 모두 사용할 수 있다. 이는 값을 int로 반환한다.
# sort_array = array.sort()은 원본 리스트인 array를 정렬하므로 새로운 리스트를 만들어서 sort_array에 넣을 수 없다.

# 중앙값 구하기 개선

def solution(array):
    return sorted(array)[len(array) // 2]
# 정리하고 보면 이렇게 간단하게 정리 가능하다. ~ 이거나 다름없다 느낌
```

# 2. 최빈값 구하기 
-> 원트에 성공 !!!! (두 방이 짝지어져 있는 개념)
```python
def solution(array):
    new_array = list(set(array))   # 중복값을 제거한 리스트
    x = []

    for i in new_array:
        x.append(array.count(i))
    
    a = max(x)                     # x 리스트 안에서의 최댓값
    b = a
    c = x.index(max(x))            
    # 최댓값 중 가장 먼저 나오는 값의 인덱스 번호
    x.remove(a)                    
    # x에서 가장 먼저 등장하는 최댓값을 지워버림

    if b in x:
        answer = -1
    
    else:
        answer = new_array[c]

    return answer
    ```

# 다른 좋은 방식 -> 이거 생각했었는데 이게 되네
def solution(array):
    answer = 0
    idx = [0] * 1001
    for i in array:
        idx[i] +=1
    if idx.count(max(idx)) >1:
        return -1
    return idx.index(max(idx))

# 리스트(방)을 길게 만들어두고 그 숫자와 같은 번호의 방에 계속 카운트를 해서 방번호(==숫자)를 도출하는 방식
# 리턴을 두개 쓸 수 있다.
```

# 3. 짝수는 싫어요 
-> 맞긴한데 아래가 훨씬 효율적이다.
```python
def solution(n):
    answer = []
    if n % 2 == 0:                # 짝수일때
        for i in range(1, n//2 + 1):
            answer.append(i * 2 -1)
    
    if n % 2 != 0:                # 홀수일때
        for i in range(1, (n + 1) // 2 +1):
            answer.append(i * 2 - 1)
    
    return answer

# 최고의 풀이 - 2칸씩 갈 수 있다는 사실을 망각하고 있었다,, 홀수, 짝수는 이렇게 2칸씩 세는게 훨씬 낫다.

def solution(n):
    return list(range(1, n+1, 2))
```

# 4. 짝수의 합
```python
def solution(n):
    answer = 0
    for i in range(0, n +1, 2):
        answer += i
    return answer
```

# 5. 평균값 구하기

```python
def solution(numbers):
    x = 0
    for i in numbers:
        x += i
    return x / len(numbers)

# 라이브러리 사용
import numpy as np
def solution(numbers):
    return np.mean(numbers)

# sum 함수 사용
def solution(numbers):
    return sum(numbers) / len(numbers)
```

# 6. 문자열 안에 문자열 
-> 해봤는데 되네
```python
def solution(str1, str2):
    return -bool(str2 in str1) + 2 # 문자열 안의 문자열은 in으로 빼낼 수 있음. 

# 안될 거 같더라도 실제로 될 수도 있으니 일단 시험해보는 태도가 중요한듯
# bool은 int의 하위 클래스이다. 따라서 정수변환기능이 같이 들어있다

# 그냥 이게 더 낫다. in은 bool같은거 없이도 True, Fales를 판단해준다.
def solution(str1, str2):
    return -(str2 in str1) + 2
```

# 7. 역순 
내 답안
```python
def solution(num_list):
    return num_list[::-1]

# 리스트를 리버스로 뒤집거나 pop으로 맨 위에 있는 것(다음에 나갈 것)을 뽑아낼 수 있다.
def solution(num_list): 
    num_list.reverse()
    return num_list

def solution(num_list):
    result =[]
    while(num_list):
        result.append(num_list.pop())
    return result
```

# 8. 곱해서 만들 수 있는 최대값

```python
def solution(numbers):
    a = []
    a.append(max(numbers))
    numbers.remove(max(numbers))
    a.append(max(numbers))
    return a[0] * a[1]    

# 위의 것도 사실 정렬 문제
def solution(numbers):
    numbers.sort()
    return numbers[-2] * numbers[-1]
    ```

> The longer I live, the more I realize that I am never wrong about anything, and that all the pains I have so humbly taken to verify my notions have only wasted my time!
>
> <cite>George Bernard Shaw</cite>


---
layout: post
title:  2025-02-24 python
description: python coding test
date:   2025-02-24 
image:  '/images/velog-썸네일-001.png'
tags:   [coding]
---
# 1. 삼각형의 완성조건
```python
def solution(sides):
    a = max(sides)
    sides.remove(a)
    return -(a < sum(sides)) + 2

# 가장 큰거를 꺼내고 나머지 꺼내고 할때는 오름차순 정렬 - 순서대로 무언가를 해야할 때
def solution(sides):
    sides.sort()
    return 1 if sides[0]+sides[1]>sides[2] else 2

# 가장 큰변 * 2 < 모든 변의 합
def solution(sides):
    return 1 if sum(sides) > 2 * max(sides) else 2
```

# 2. 배열의 유사도
```python
def solution(s1, s2):
    answer = 0
    for i in s1:
        if i in s2:
            answer += 1
    return answer

# 집합도 연산을 할 수 있다.
def solution(s1, s2):
    return len(set(s1)&set(s2))

# 파이썬에서의 집합연산
A = {1, 2, 3}
B = {2, 3, 4}

print(A & B)  # {2, 3}  (교집합)
print(A | B)  # {1, 2, 3, 4} (합집합)
print(A - B)  # {1} (차집합)
print(A ^ B)  # {1, 4} (대칭 차집합)
```

# 3. 머쓱이보다 키 큰 사람
```python
def solution(array, height):
    answer = 0
    for i in array:
        if i > height:
            answer += 1
    return answer
```

# 4. 자릿수 더하기
```python
def solution(n):
    answer = []
    for i in str(n):
        answer.append(int(i)) # sum연산을 위해 int로 다시 변환
    return sum(answer)
```

# 5. 배열 원소의 길이
```python
def solution(strlist):
    answer = []
    for i in strlist:
        answer.append(len(i))
    return answer

# 리스트 컴프리헨션은 입력한 원소 순서와 동일하게 배열을 구성한다.
def solution(strlist):
    return [len(str) for i in strlist]
```

# 6. n의 배수 고르기
```python
def solution(n, numlist):
    answer = []
    for i in numlist:
        if i % n == 0:
            answer.append(i)
    return answer

# if 문이 껴있어도 그냥 일렬로 써도 된다.
def solution(n, numlist):
    return [i for i in numlist if i % n == o]
```

# 7. 순서쌍의 개수 
-> len()으로 사용해야함 , 0으로 나누면 안되므로 시작을 1로 해야함.
```python
def solution(n):
    return len([i for i in range(1, n+1) if n % i == 0])

# 시간 복잡도를 줄이는 판단 -> 절반까지만 세고 2배씩 카운트
def solution(n):
    answer = 0
    for i in range(1, int(n ** 0.5) + 1):
        if n % i == 0:
            answer += 2

            if i * i == n:
                answer -= 1

    return answer
```

# 8. 모음 제거
```python
def solution(my_string):
    return "".join([i for i in my_string if i not in ["a","e","i","o","u"]])
# not in "aeiou"도 된다.
```

# 9. replace로 문자열 바꾸기
```python
def solution(my_string):
    v = ["a","e","i","o","u"]
    for i in v:
        my_string = my_string.replace(i, "")
    return my_string
```

# 10. 리스트에서 해당하는 정수 개수
```python
def solution(array, n):
    return array.count(n)
```

# 11. 가위 바위 보 
-> 문자열은 문자열과 같다는 점을 잊으면 안됨
```python
def solution(rsp):
    answer = ""
    for i in rsp:
        if i == "2":
            answer += "0"
        elif i == "5":
            answer += "2"
        else:
            answer += "5"
    return answer

# 딕셔너리는 인덱스로 키값을 호출하면 value 같이 나온다.
def solution(rsp):
    d = {"2":"0","5":"2","0":"5"}
    return "".join(d[i] for i in rsp)

# 문자열은 더할때마다 새로 생성해서 더하므로 시간 복잡도가 o(n^2)일수도 -> jpin으로하면 한번에 다 바꾸므로 시간 복잡도가 낮다.
def solution(rsp):
    return "".join("0" if i == "2" else "2" if i == "5" else "5" for i in rsp)
```

# 12. 숨어있는 숫자의 덧셈 
```python
def solution(my_string):
    answer = []
    for i in my_string:
        if i.isnumeric():    # isnumeric은 허용 숫자범위가 isdigit(0~9)보다 넓다. if문은 그 문장이 참이면 된다.
            answer.append(int(i))
    return sum(answer)
```

# 13. 최댓값 구하기 2 (깔쌈하네요)
```python
def solution(numbers):
    a = sorted(numbers)
    return max(a[-1] * a[-2], a[0] * a[1]) 

# 대문자와 소문자 -> 한방에 바꾸는 swapcase라는 함수가 있긴하다.
def solution(my_string):
    a = []
    for i in my_string:
        if i.isupper():
            a += i.lower()
        else:
            a += i.upper()
    return "".join(a)
```
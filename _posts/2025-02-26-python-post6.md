---
layout: post
title:  2025-02-26 python
description: python coding test
date:   2025-02-26 
image:  '/images/velog-썸네일-001 (8).png'
tags:   [coding]
---
# 0. 파이썬 수업 내용

### 1) 바깥에서 안으로 좁혀가면서 작성하기 (프로그램의 실행 순서대로)

### 2) 마지막 회차 생략하기 ==> i + 증가량 < 반복종료값 -> 구구단이랑 활용
```python
for i in range(2,10):
    for j in range(1,10):
        print(f"{i} x {j} = {i*j}")
    if i + 1 < 10:
        print("------")
```

### 3) 별찍기
```python
for i in range(0,5):
    star = ""
    for j in range(0, -i+5):
        star += "*"
    print(star)
```

### 4) 별찍기 2
```python
for i in range(0,5):
    for j in range(0, i+1):
        star = ""
        star += (" " * (4-j) + "*" *(j+1))
    print(star)
```

### 5) 제곱수
-> 굳이 n까지 다 반복하지 않고 제곱수는 n//2보다 무조건 작으니까 저기까지만 반복하기 -> 최대한 아끼기
```python
def solution(n):
    answer = 2
    for i in range(2, n//2):
        if i ** 2 ==n:
            answer = 1
            break
    return answer
```

### 6) 펙토리얼 찾기
-> 맨 마지막에 나온 answer를 그냥 답으로 취할 수 있음.
```python
def solution(n):
    answer = o

    for i in range(1, n+1):
        fact = 1
        for i in range(2, i+1):
            fact *= j
        if fact <= n:
            answer = i
        else:
            break
    return answer
```

### 7) 최소공배수 찾기
```python
def solution(n):
    answer = 1
    while True:
        if answer * 6 % n == 0:
            break
        answer += 1
    return answer
```

# 1. 배열 회전시키기
```python
def solution(numbers, direction):
    answer = []
    if direction == "right":
        answer.append(numbers[-1])
        numbers.pop()
        for i in numbers:
            answer.append(i)
    else:
        a = numbers[0]
        numbers.remove(numbers[0])
        for i in numbers:
            answer.append(i)
        answer.append(a)
    return answer

# 리스트도 덧셈이 가능하다. 
# 슬라이싱으로 하는게 정석인듯 (슬라이싱 마지막은 제외) 
# -> numbers[-1]이걸 리스트로 더하려면 [numbers[-1]] 이렇게 해줘야한다.
def solution(numbers, direction):
    if direction == "right":
        answer = [numbers[-1]] + numbers[:-1] 
    else:
        answer = numbers[1:] + [numbers[0]] 
    return answer
```

# 2. 369게임
```python
def solution(order):
    answer = 0
    for i in str(order):
        if i == "3" or i == "6" or i == "9":
            answer += 1 
    return answer

# 문자열로 바꿔서 카운트 함수 써버리는게 더 빠르다.
# 시간 복잡도도 더 낮을듯
def solution(order):
    answer = 0
    order = str(order)
    return order.count('3') + order.count('6') + order.count('9')
```

# 3. 숫자 찾기
```python
def solution(num, k):
    if str(k) in str(num):
        return str(num).index(str(k)) + 1
    else:
        return -1
```

# 4. 합성수 찾기 
-> 전체에서 소수를 뺐다. 근데 해보고 나니까 원래대로 하나 소수만 찾나 for 문 두번 돌리는 건 같아서 그냥 합성수만 찾을 걸 그랬다.
그냥 아래서 == 0 부분만 != 0 으로 바꾸고 답을 len(answer)하면 된다.
```python
def solution(n):
    answer = []
    cnt = 0
    for i in range(1, n+1):
        for k in range (1, i + 1):
            if i % k == 0:
                cnt += 1
        if cnt < 3:
            answer.append(i)
        cnt = 0

    return n - len(answer)
```

# 5. 중복된 문자 제거
```python
def solution(my_string):
    answer = []
    for i in my_string:
        if i not in answer:
            answer.append(i)
    return "".join(answer)
```

# 6. 모스부호 1
-> 공백을 기준으로 글자 변환, 마지막은 공백이 없으므로 글자를 추가하였다.
```python
def solution(letter):
    morse = { 
    '.-':'a','-...':'b','-.-.':'c','-..':'d','.':'e','..-.':'f',
    '--.':'g','....':'h','..':'i','.---':'j','-.-':'k','.-..':'l',
    '--':'m','-.':'n','---':'o','.--.':'p','--.-':'q','.-.':'r',
    '...':'s','-':'t','..-':'u','...-':'v','.--':'w','-..-':'x',
    '-.--':'y','--..':'z'
}
    answer = []
    box = ""
    for i in (letter + " "):
        if i == " ":
            answer.append(morse[box])
            box = ""
        else:
            box += i    
    return "".join(answer)


# split으로 글자단위로 구분할 수 있다.
def solution(letter):
    morse = { 
    '.-':'a','-...':'b','-.-.':'c','-..':'d','.':'e','..-.':'f',
    '--.':'g','....':'h','..':'i','.---':'j','-.-':'k','.-..':'l',
    '--':'m','-.':'n','---':'o','.--.':'p','--.-':'q','.-.':'r',
    '...':'s','-':'t','..-':'u','...-':'v','.--':'w','-..-':'x',
    '-.--':'y','--..':'z'
}
    answer = []
    sp_letter = letter.split(" ")
    for i in sp_letter:
        answer += morse[i]
    return "".join(answer)
```

# 7. 2차원으로 만들기
```python
def solution(num_list, n):
    answer = []
    box = []
    for i in num_list:
        box.append(i)
        if len(box) == n:
            answer.append(box)
            box = []

    return answer

# 리스트를 한방에 넣는 방법을 고민해야함. box를 한번 거쳐가는건 너무 느리다. 
-> 리스트의 값말고 인덱스를 돌리고 싶으면 range를 쓰면 된다.
def solution(num_list, n):
    answer = []
    for i in range(0, len(num_list), n):
        answer.append(num_list[i:i+n])

    return answer
```

# 8. k의 개수
-> str로 만들면 숫자를 각 자리 숫자 단위로 볼 수 있다.
```python
def solution(i, j, k):
    answer = 0
    for p in range(i, j+1):
        answer += str(p).count(str(k))
    return answer
```

# 9. A로 B 만들기
-> 재배열해서 before가 after가 될 수 있는가 == 구성요소가 같은가
```python
def solution(before, after):
    return int(sorted(list(before)) == sorted(list(after)))

# 굳이 리스트로 안해도 sorted가 뭐든 정렬해서 리스트로 반환한다. -> 함수 쓰기 전에 다양한 type에서 되는지 미리 실험해보고 쓰기 (헷갈리면)
def solution(before, after):
    return int(sorted(before) == sorted(after))
```

# 10. 진료순서 정하기
-> 리스트의 원소를 크기 순으로 매긴 순번으로 바꾸기
-> 리스트는 append 추가
```python
def solution(emergency):
    answer = []
    s_emergency = sorted(emergency)[::-1]
    for i in emergency:
        answer.append((s_emergency.index(i)) + 1)
        
    return answer
```

# 11. 팩토리얼 찾기
```python
def fec(n):
    answer = 1
    for i in range(1, n+1):
        answer *= i
    return answer

def solution(n):
    for i in range(1, 12):
        if fec(i) > n:
            return i - 1
```

# 12. 숨어있는 숫자의 덧셈 (2)
-> int("01") -> 1로 나온다. 문자에서 그 전까지 숫자가 들어가므로 마지막이 숫자일때 문제 발생 그래서 마지막에 문자 하나를 넣어준다.
```python
def solution(my_string):
    answer = []
    box = "0"
    for i in (my_string + "a"):
        if i.isdigit():
            box += i
        else:
            answer.append(int(box))
            box = "0"

    return sum(answer)
```

# 13. 가까운 수 
-> answer 즉 차이의 초기값은 가까운 값을 궁극적으로 원하므로 최대한 높게 잡은 후에 점점 줄여간다.
```python
def solution(array, n):
    answer = 100
    box = []
    for i in array:
        if abs(n - i) < answer:
            box = []
            answer = abs(n - i)
            box.append(i)
        elif abs(n - i) == answer:
            box.append(i)       
    return min(box)


print(solution([3, 10, 28],20))

# sort의 key를 이용하여 자동정렬하는 방법
def solution(array, n):
    array.sort(key = lambda i:abs(i-n),i-n) # abs(i-n)과 i-n이 모두 작은 값부터 정렬한다.
    answer = array[0]                       # x는 array의 각 요소를 순서대로 하나씩 가져오게 해준다.
    return answer
```

# 14. 한 번만 등장한 문자
```python
def solution(s):
    answer = []
    box = []                    # 로그 남겨두기용
    for i in s:
        if i in answer:
            answer.remove(i)
            box.append(i)

        elif i not in answer and i in box:
            box.append(i)

        else:
            answer.append(i)
            box.append(i)

    return "".join(sorted(answer))

print(solution("abcabcadc"))

# 카운트가 그냥 1이면 리스트에 넣어서 정렬하기
def solution(s):
    answer = "".join(sorted[i for i in s if s.count(i) == 1])
    return answer
```

# 15. 7의 개수
```python
def solution(array):
    answer = 0
    for i in array:
        answer += str(i).count("7")
    return answer

# 그냥 리스트를 한방에 문자열로 만들고 거기서 count "[7,77,777]"이아도 "7" 하나하나 수를 샐 수 있다.
def solution(array):
    str(array).count("7")
```

# 16. 컨트롤 제트
```python
def solution(s):
    answer = 0
    box = []
    s_split = s.split(" ")
    for i in s_split:
        if i != "Z":
            answer += int(i)
            box.append(int(i))

        else:
            answer -= box[-1]

    
    return answer
```

# 17.소인수분해 -> 약수찾기-> 소수찾기
```python
def solution(n):
    answer = []
    box = []
    for i in range(2, n+1):
        if n % i == 0:                     # 약수인가?
            for j in range(2, i):
                if i % j == 0:             # 소수인가?
                    box.append(j)
            if len(box) == 0:
                answer.append(i)
        box = []                           # 박스가 바깥 for과 같아지면 다음 i가 나올때 앞의 box가 비워지지 않아서 문제가 발생함.
    return answer

# 참인 상황을 정의하고 아니면 나오게 하는 방법
def solution(n):
    answer = []
    for i in range(2, n+1):
        if n % i == 0:                     # 약수인가?
            is_prime = True
            for j in range(2, i):          # for j in range(2, int(math.sqrt(i)) + 1): 이렇게 제곱근만 판별하면 더 빠를수도
                if i % j ==0:
                    is_prime = False       # 약순데 뭔가로 나눠져? 그럼 소수아니지
                    break
        if is_prime:
            answer.append(i)
    return answer
```

# 18. 이진수 더하기
-> int로 문자열을 이진수로 읽고 십진수로 바꿀 수 있다.
-> bin을 통해 10진수를 이진수로 바꿀 수 있다.
```python
def solution(bin1, bin2):
    return bin(int(bin1,2) + int(bin2,2))[2:] # 이진수 뒤에 붙는 0b 접두사를 제거해줘야 한다.
```

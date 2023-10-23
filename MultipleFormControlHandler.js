"use strict";

class MultipleFormControlHandler{
    static instance = null;
    static getInstance(){
        if(!this.instance){
            this.instance = new this();
        }
        return this.instance;
    }
    static activate(){
        let instance = this.getInstance();
        instance.printDebug('activate');
        if(!globalThis?.window){ throw('window is not exists'); }
        instance.addEventListener(globalThis?.window);
    }
    static deactivate(){
        let instance = this.getInstance();
        instance.printDebug('deactivate');
        instance.removeEventListener();
    }

    //---------------------------

    activated = false;
    listener = null;
    target = null;
    debug = false;

    /**
     * @constructs
     */
    constructor(){
        this.activated = false; //동작
        this.listener = null; // 이벤트를 붙이는 대상. 기본은 window
        this.target = null; // 최초 이벤트 발생 요소(pointerdown 에서 event.target)
        this.reset();
    }
    
    /**
     * 초기화
     */
    reset(){

    }
    /**
     * 디버깅용 (개발용)
     */
    printDebug(){
        if(!this.debug){return;}
        console.log.apply(null, [this.constructor.name , ...arguments]);
    }


    addEventListener(listener){
        this.listener = listener;
        this.listener.addEventListener('keydown',this.cb_keydown);
        this.listener.addEventListener('focusout',this.cb_focusout);
        this.listener.addEventListener('click',this.cb_click);
    }
    removeEventListener(){
        this.listener.removeEventListener('keydown',this.cb_keydown);
        this.listener.removeEventListener('focusout',this.cb_focusout);
        this.listener.removeEventListener('click',this.cb_click);
    }


    getContainer(target){
        return target.closest('.mfch-container');
    }
    getItem(target){
        return target.closest('.mfch-item');
    }

    cb_keydown = (event)=>{ this.keydown(event); }

    keydown(event){
        console.log(event);
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        return this.processForKeyboard(event);
    }

    cb_focusout = (event)=>{ this.focusout(event); }

    focusout(event){
        console.log(event);
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        return this.processForFocusout(event);
    }

    cb_click = (event)=>{ this.click(event); }

    click(event){
        console.log(event);
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        return this.processForClick(event);
    }

    processForKeyboard(event){
        const container = this.getContainer(event.target);
        if(!container){ this.printDebug('skip 1'); return;}
        const item = this.getItem(event.target);
        if(!item){ this.printDebug('skip 2'); return;}
        const input = item.querySelector('input');
        if(!input){ this.printDebug('skip 3'); return;}

        const key = event.key;

        // switch (event.key) {
        //     case " ": break;
        //     case "Enter":  break;
        //     case "Backspace": break;

        //     // case "ArrowDown": break;
        //     // case "ArrowUp": break;
        //     // case "ArrowLeft": break;
        //     // case "ArrowRight": break;
        //     // case "Escape": break;
        //     default: break; // Quit when this doesn't handle the key event.
        // }

        let seperator = container.dataset.mfchSeperator??'( )';
        const regexp = new RegExp(seperator);
        if(regexp.test(event.key)){
            // console.log('!seperator!');
            this.stopEvent(event);
            if(input.value.length == 0){
                console.log('빈 문자열');
            }else if(!input.checkValidity()){
                console.log('!checkValidity ');
            }else{
                this.appendItem(container,item)
            }
        }

        // 삭제 동작
        if(event.key=='Backspace'){
            if(input.value.length == 0){
                console.log('삭제 진행');
                this.removeItem(item)
            }
        }
    }
    processForFocusout(event){
        const container = this.getContainer(event.target);
        if(!container){ this.printDebug('skip 1'); return;}
        const item = this.getItem(event.target);
        if(!item){ this.printDebug('skip 2'); return;}
        const input = item.querySelector('input');
        if(!input){ this.printDebug('skip 3'); return;}
        const key = event.key;
        let seperator = container.dataset.mfchFocusout??'';
        if(seperator == ''){return seperator;}
        const regexp = new RegExp(seperator);

        if(regexp.test('append')){
            if(input.value.length == 0){
                console.log('빈 문자열');
            }else if(!input.checkValidity()){
                console.log('!checkValidity ');
            }else{
                this.appendItem(container,item)
            }
        }
        if(regexp.test('remove')){
            if(input.value.length == 0){
                console.log('삭제 진행');
                this.removeItem(item,false)
            }
        }

        
    }
    processForClick(event){
        const container = this.getContainer(event.target);
        if(!container){ this.printDebug('skip 1'); return;}
        const item = this.getItem(event.target);
        if(!item){ this.printDebug('skip 2'); return;}
        const input = item.querySelector('input');
        if(!input){ this.printDebug('skip 3'); return;}
        const key = event.key;

        if(event.target.classList.contains('mfch-item-btn-remove')){
            console.log('제거 버튼 클릭');
            this.removeItem(item)
        }
    }
    


    stopEvent(event){
        event.stopPropagation();
        event.preventDefault();
    }

    /**
     * form-control element 가져오기
     */
    firstItem(container){
        return container.querySelector('.mfch-item')
    }
    appendItem(container,item){
        // 다음요소를 찾아서 비어있다면 이 요소를 대신 사용한다.

        let next_item = item;
        do{
            next_item = next_item.nextElementSibling;
        }while(next_item && !next_item.classList.contains('mfch-item'))

        let new_item = null;
        if(next_item && next_item.querySelector('input , select , textarea').value ==''){
            new_item = next_item;    
        }else{
            new_item = this.firstItem(container).cloneNode(true);
            new_item.querySelectorAll('input , select , textarea').forEach(el => {
                // el.value = el.defaultValue;
                el.value = '';
            });
            item.after(new_item)
        }
        new_item.querySelector('input , select , textarea').focus();
        this.clearItems(container);
    }
    removeItem(item,autofocus){

        let prev_item = item;
        do{
            prev_item = prev_item.previousElementSibling;
        }while(prev_item && !prev_item.classList.contains('mfch-item'))
        if(!prev_item){
            console.log('이전요소 없음');
            return;
        }
        item.remove();
        if(autofocus) prev_item.querySelector('input , select , textarea').focus();
    }
    /**
     * 불필요한 빈 요소 삭제
     * @param {HTMLElement} container 
     */
    clearItems(container){
        const remain = container.dataset.clearRemain??1;
        let inputs = container.querySelectorAll(':scope .mfch-item input');
        console.log(inputs);
        let finded_empty = 0;
        inputs.forEach((el)=>{
            if(el.value==''){
                if(finded_empty < remain){
                    finded_empty++;
                }else{
                    this.getItem(el).remove();
                }
            }
        })
    }






}
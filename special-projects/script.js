

$(document).ready(function () {
  
    /*$(".filter-wrapper").on("click", "a", function(){
      
    if( !$(this).is("[type]") ) return;
    
      let n = $(this).attr("type");
      
      $(".filter-wrapper a").css("opacity", 0.4);
      $(this).css("opacity", 1);
      
      $(".filter-wrapper a").attr("hide", "");
      $(this).removeAttr("hide");
      
      if( n == "all"){
         $("#index[library] .wrapper a").removeAttr("hide");
        return;
      }
      
      if( n == "loved"){
        $("#index[library] .wrapper a").attr("hide", "");
  
        $("#index[library] .wrapper a").each(function(){
          if( $(this).is("[loved]") ){
            $(this).removeAttr("hide");
          }
        });
  
        return;
      }
      
      $("#index[library] .wrapper a").attr("hide", "");
      
      $("#index[library] .wrapper a").each(function(){
        if( $(this).find("span[type]").html() == n ){
          $(this).removeAttr("hide");
        }
      });
      
  //    $("#index span[type]").html();
      
    });*/
    
    /*$("#index .wrapper").on("mouseover", "a", function(){
      if( $(this).attr("emote") ){
        $("#emote").html( $(this).attr("emote") );
      }else{
        $("#emote").html("");
      }
      
      if( $(this).attr("img") ){
        $("#img").attr("custom", "");
        $("#img").css("background-image", "url('i/" + $(this).attr("img") +"')");
        
      } else{
       $("#img").removeAttr("custom");
        $("#img").css("background-image", "url('../assets/transparency.png')")
      }
    });*/
  
    
    $.getJSON("https://opensheet.elk.sh/1wys3Ep3C1aemJU55aNxlwpAwkcvbCjYKGIzWocSsJ30/Books", function (data) {

      data.forEach(function (row, i) {
        
        console.log(row);
        console.log(row.img);
        if(row.img){
          console.log(row.img);
          $(`<div class="bookwrapper" style="width:`+row.l*3+`rem;">
                  <div id="unjustified-texts-perspectives-on-typography" class="bookwrapper__anchor"></div>
                  <a href="`+row.link+`" target="_blank" class="book book--338 bright" data-color="`+row.color+`" style="height:`+row.h*3+`rem;padding:0 `+row.w*1.5+`rem `+row.w*1.5+`rem 0;">
                      <div class="book__back" style="border-color:`+row.color+`;top:`+row.w*1.5+`rem;left:`+row.w*1.5+`rem;"></div>
                      <div class="book__spine" style="background-color:`+row.color+`; height:`+row.w*1.5+`rem;"></div>
                      <div class="book__front" style="background-color:`+row.color+`;border-bottom:solid .2rem `+row.color+`;border-right:solid .2rem `+row.color+`;">
                          <img src="`+row.img+`" style="height: inherit;">
                      </div>
                  </a>
              </div>`)
            .prependTo("#index[library] .row");
        }
      })
      
    })
    
    
    // $('#index[library] div[header] span').click(function () {
  
    //   let by = $(this).attr("f");
  
    //   divArr = $("#index[library] .wrapper a")
      
    //   divArr.sort(function (a, b) {
    //     return $(a).find("span[sort='" + by + "']").text() > $(b).find("span[sort='" + by + "']").text() ? 1 : -1;
    //   })
  
    //   $("#index[library]  .wrapper").html(divArr)
  
    // })
  
    
  });